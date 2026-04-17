// @ts-nocheck — Deno runtime, not Node/browser
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

// ── Google Service Account JWT auth ─────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const email = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL")!;
  const rawKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")!;
  const pem = rawKey.replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: email,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const keyData = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const body = btoa(JSON.stringify(payload))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const sigInput = new TextEncoder().encode(`${header}.${body}`);
  const sigBytes = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, sigInput);
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBytes)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const jwt = `${header}.${body}.${sig}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const json = await res.json();
  if (!res.ok) throw new Error(`Token error: ${JSON.stringify(json)}`);
  return json.access_token as string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function calApi(path: string, token: string, opts: RequestInit = {}) {
  return fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(opts.headers ?? {}),
    },
  });
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// ── Busy days calculation ────────────────────────────────────────────────────
// Working hours: 11:00–19:00 = 480 min. Block day if ≥ 420 min busy (87.5%)

function toDateKey(iso: string): string {
  return iso.slice(0, 10); // "YYYY-MM-DD"
}

function minutesOverlap(
  busyStart: Date,
  busyEnd: Date,
  workStart: Date,
  workEnd: Date,
): number {
  const start = Math.max(busyStart.getTime(), workStart.getTime());
  const end = Math.min(busyEnd.getTime(), workEnd.getTime());
  return Math.max(0, (end - start) / 60000);
}

function computeBusyDays(events: any[]): { blockedDays: string[]; partialDays: string[] } {
  const allDayBlocked = new Set<string>();
  const busyMinutes: Record<string, number> = {};

  for (const ev of events) {
    // All-day event
    if (ev.start?.date && !ev.start?.dateTime) {
      // Multi-day all-day events span start.date to end.date (exclusive)
      const start = new Date(ev.start.date + "T00:00:00");
      const end   = new Date(ev.end.date   + "T00:00:00");
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        allDayBlocked.add(toDateKey(d.toISOString()));
      }
      continue;
    }

    // Timed event — accumulate busy minutes within 11:00–19:00
    if (ev.start?.dateTime && ev.end?.dateTime) {
      const evStart = new Date(ev.start.dateTime);
      const evEnd   = new Date(ev.end.dateTime);
      const dateKey = toDateKey(evStart.toISOString());

      // Work window for this day
      const workStart = new Date(dateKey + "T11:00:00");
      const workEnd   = new Date(dateKey + "T19:00:00");

      const mins = minutesOverlap(evStart, evEnd, workStart, workEnd);
      busyMinutes[dateKey] = (busyMinutes[dateKey] ?? 0) + mins;
    }
  }

  const blockedDays: string[] = [...allDayBlocked];
  const partialDays: string[] = [];

  for (const [day, mins] of Object.entries(busyMinutes)) {
    if (allDayBlocked.has(day)) continue;
    if (mins >= 420) {
      blockedDays.push(day);
    } else {
      partialDays.push(day);
    }
  }

  return { blockedDays, partialDays };
}

// ── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  const defaultCalendarId = Deno.env.get("GOOGLE_CALENDAR_ID")!;

  try {
    const token = await getAccessToken();
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    // Accept calendarId from query param, fall back to env var
    const calendarId = url.searchParams.get("calendarId") || defaultCalendarId;

    // ── GET busy-days — returns blocked + partial days for a date range ──────
    if (req.method === "GET" && action === "busy-days") {
      const timeMin = url.searchParams.get("timeMin");
      const timeMax = url.searchParams.get("timeMax");
      if (!timeMin || !timeMax) return json({ error: "timeMin and timeMax required" }, 400);

      const res = await calApi(
        `/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=500`,
        token,
      );
      const data = await res.json();
      if (!res.ok) return json({ error: data }, res.status);

      return json(computeBusyDays(data.items ?? []));
    }

    // ── GET events — list events for calendar/dashboard ───────────────────────
    if (req.method === "GET") {
      const timeMin = url.searchParams.get("timeMin") ?? new Date().toISOString();
      const timeMax = url.searchParams.get("timeMax") ??
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const res = await calApi(
        `/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=250`,
        token,
      );
      const data = await res.json();
      if (!res.ok) return json({ error: data }, res.status);
      return json(data);
    }

    // ── POST — create event ───────────────────────────────────────────────────
    if (req.method === "POST") {
      const body = await req.json();
      // Allow overriding calendarId in the body
      const targetCalendar = body.calendarId || calendarId;
      const { calendarId: _removed, ...eventBody } = body;

      const res = await calApi(
        `/calendars/${encodeURIComponent(targetCalendar)}/events?sendUpdates=all`,
        token,
        { method: "POST", body: JSON.stringify(eventBody) },
      );
      const data = await res.json();
      if (!res.ok) return json({ error: data }, res.status);
      return json(data);
    }

    // ── DELETE — delete event by id ───────────────────────────────────────────
    if (req.method === "DELETE") {
      const eventId = url.searchParams.get("eventId");
      if (!eventId) return json({ error: "eventId required" }, 400);

      const res = await calApi(
        `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
        token,
        { method: "DELETE" },
      );

      if (res.status === 204 || res.status === 200) return json({ ok: true });
      const data = await res.json();
      return json({ error: data }, res.status);
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

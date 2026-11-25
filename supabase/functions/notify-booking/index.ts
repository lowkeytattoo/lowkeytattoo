// @ts-nocheck — Deno runtime, not Node/browser
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// ── WhatsApp via CallMeBot ────────────────────────────────────────────────────

// Returns true = delivered/queued, false = failed
async function sendWhatsApp(phone: string, apiKey: string, message: string, label: string): Promise<boolean> {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
  const res = await fetch(url);
  const body = await res.text();

  // "Message queued" in body = real success regardless of any other text
  if (res.ok && /queued/i.test(body)) {
    console.log(`[notify-booking] WhatsApp OK → ${label}`);
    return true;
  }

  // Anything else: HTTP error or CallMeBot soft-error (returns 200 with error text)
  console.warn(`[notify-booking] CallMeBot failed for ${label} (${res.status}):`, body.trim());
  return false;
}

async function sendEmailAlert(subject: string, text: string): Promise<void> {
  const apiKey     = Deno.env.get("BREVO_API_KEY");
  const adminEmail = Deno.env.get("ADMIN_EMAIL") ?? "info@tattoolowkey.com";
  if (!apiKey) {
    console.warn("[notify-booking] BREVO_API_KEY not set — cannot send email alert");
    return;
  }
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender:      { name: "Lowkey Bot", email: "info@tattoolowkey.com" },
        to:          [{ email: adminEmail, name: "Admin" }],
        subject,
        textContent: text,
      }),
    });
    if (!res.ok) console.warn("[notify-booking] Email alert failed:", await res.text());
  } catch (err) {
    console.warn("[notify-booking] Email alert error:", err);
  }
}

// ── RGPD ──────────────────────────────────────────────────────────────────────
//
// CallMeBot is a free third-party relay without a data processing agreement,
// so messages NEVER carry client data (name, phone, email, body zone,
// description, notes): only what happened, service, artist, date/time and a
// REF to open it in the panel (tickets INT-01 / C05).
//
// Anti-abuse: the public web only sends the id of a row it just inserted; the
// rest is read from the database. Calendar notices require a staff session.

const SERVICE_LABELS: Record<string, string> = {
  tattoo: "Tatuaje",
  piercing: "Piercing",
  laser: "Láser",
};

const KNOWN_ARTISTS = new Set(["pablo", "sergio", "fifo"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const refOf = (id: string) => id.replace(/-/g, "").slice(0, 8).toUpperCase();
const clip  = (v: unknown, max: number) => String(v ?? "").replace(/[\r\n]+/g, " ").slice(0, max);
const cap   = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

/** Public booking: reads the row (inserted < 10 min ago) by id with the service role. */
async function recentBooking(id: unknown): Promise<Record<string, any> | null> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key || typeof id !== "string" || !UUID_RE.test(id)) return null;
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const qs = new URLSearchParams({
    select: "id,artist_config_id,service_type,preferred_date,preferred_time",
    id: `eq.${id}`,
    created_at: `gte.${since}`,
    limit: "1",
  });
  const res = await fetch(`${url}/rest/v1/web_bookings?${qs}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

/** True only for a real logged-in user (staff), not the public anon key. */
async function isStaffRequest(req: Request): Promise<boolean> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const auth = req.headers.get("Authorization") ?? "";
  if (!url || !key || !auth.startsWith("Bearer ")) return false;
  const res = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: auth } });
  if (!res.ok) return false;
  const user = await res.json();
  return typeof user?.id === "string";
}

// ── Handler ───────────────────────────────────────────────────────────────────
//
//   { kind: "booking",  booking_id }                         — public web form (anon key)
//   { kind: "calendar", artist_id, action, service?, date? } — admin panel (staff JWT)

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json();
    let artist_id: string | null = null;
    let lines: string;
    let label: string;

    if (body.kind === "booking") {
      const row = await recentBooking(body.booking_id);
      if (!row) return json({ error: "Not found" }, 403);
      artist_id = KNOWN_ARTISTS.has(String(row.artist_config_id)) ? String(row.artist_config_id) : null;
      const service = SERVICE_LABELS[String(row.service_type)] ?? "cita";
      const ref = refOf(row.id);
      const date = row.preferred_date
        ? String(row.preferred_date).split("-").reverse().join("/") + (row.preferred_time ? ` ${clip(row.preferred_time, 20)}` : "")
        : null;
      label = `solicitud web REF ${ref}`;
      lines = [
        `🔔 Nueva solicitud de ${service}${artist_id ? ` para ${cap(artist_id)}` : ""} · REF ${ref}`,
        date ? `📅 Fecha pedida: ${date}` : null,
        ``,
        `Ver en el panel: https://tattoolowkey.com/admin/bookings?ref=${ref}`,
      ].filter((l) => l !== null).join("\n");
    } else if (body.kind === "calendar") {
      if (!(await isStaffRequest(req))) return json({ error: "Unauthorized" }, 401);
      artist_id = KNOWN_ARTISTS.has(String(body.artist_id)) ? String(body.artist_id) : null;
      if (!artist_id) return json({ error: "Unknown artist" }, 400);
      const action  = clip(body.action, 60) || "Aviso de agenda";
      const service = clip(body.service, 40);
      const date    = clip(body.date, 80);
      label = `${action} (${cap(artist_id)})`;
      lines = [
        `🔔 ${action}${service ? ` — ${service}` : ""} · ${cap(artist_id)}`,
        date ? `📅 ${date}` : null,
        ``,
        `Ver en el panel: https://tattoolowkey.com/admin/calendar`,
      ].filter((l) => l !== null).join("\n");
    } else {
      return json({ error: "Unknown kind" }, 400);
    }

    const sends: Promise<boolean>[] = [];

    // Always notify admin
    const adminPhone  = Deno.env.get("ADMIN_WA_PHONE");
    const adminKey    = Deno.env.get("ADMIN_WA_KEY");
    if (adminPhone && adminKey) {
      sends.push(sendWhatsApp(adminPhone, adminKey, lines, "admin"));
    } else {
      console.warn("[notify-booking] ADMIN_WA_PHONE / ADMIN_WA_KEY not set — skipping admin WA");
    }

    // Notify the specific artist if different from admin and configured
    if (artist_id) {
      const key        = artist_id.toUpperCase();
      const artPhone   = Deno.env.get(`${key}_WA_PHONE`);
      const artApiKey  = Deno.env.get(`${key}_WA_KEY`);

      if (artPhone && artApiKey && artPhone !== adminPhone) {
        sends.push(sendWhatsApp(artPhone, artApiKey, lines, artist_id));
      } else if (!artPhone || !artApiKey) {
        console.warn(`[notify-booking] ${key}_WA_PHONE / _WA_KEY not set — skipping artist WA`);
      }
    }

    const results = await Promise.allSettled(sends);
    const anyFailed = results.some((r) => r.status === "fulfilled" && r.value === false);

    if (anyFailed) {
      const summary = `Fallo silencioso en CallMeBot.\n\nAviso: ${label}\n\nRevisa los logs de la Edge Function en Supabase Dashboard.`;
      await sendEmailAlert("[Lowkey] ⚠️ WhatsApp no entregado — revisa CallMeBot", summary);
    }

    return json({ ok: true });
  } catch (err) {
    console.error("[notify-booking] Unexpected error:", err);
    return json({ error: "Internal error" }, 500);
  }
});

/*
── Activación CallMeBot (una sola vez por número) ─────────────────────────────

1. Guarda el número +34 623 76 13 63 en contactos como "CallMeBot"
2. Envía el mensaje: "I allow callmebot to send me messages"
3. Recibirás tu API key personal por WhatsApp en segundos

── Secrets en Supabase Dashboard → Project Settings → Edge Functions ──────────

Para el admin (tú):
  ADMIN_WA_PHONE   +34XXXXXXXXX
  ADMIN_WA_KEY     tu_api_key
  ADMIN_EMAIL      tu_email@dominio.com  (para alertas si falla CallMeBot)
  BREVO_API_KEY    xkeysib-...

Para cada artista (cuando quieras añadirlos):
  PABLO_WA_PHONE   +34XXXXXXXXX
  PABLO_WA_KEY     su_api_key

  SERGIO_WA_PHONE  +34XXXXXXXXX
  SERGIO_WA_KEY    su_api_key
*/

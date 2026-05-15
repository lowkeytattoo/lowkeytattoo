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

async function sendWhatsApp(phone: string, apiKey: string, message: string, label: string): Promise<void> {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.text();
    console.warn(`[notify-booking] CallMeBot error for ${label} (${res.status}):`, body);
  } else {
    console.log(`[notify-booking] WhatsApp OK → ${label}`);
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const { artist_id, service, client_name, client_phone, date, body_zone, description } = await req.json();

    const lines = [
      `🔔 Nueva solicitud de ${service ?? "cita"}`,
      ``,
      `👤 ${client_name ?? "Sin nombre"}`,
      `📅 ${date ?? "Fecha no especificada"}`,
      client_phone ? `📞 ${client_phone}` : null,
      body_zone    ? `📍 ${body_zone}` : null,
      description  ? `📝 ${description.slice(0, 120)}${description.length > 120 ? "…" : ""}` : null,
      ``,
      `Ver en la app: https://tattoolowkey.com/admin/bookings`,
    ].filter(Boolean).join("\n");

    const sends: Promise<void>[] = [];

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
      }
    }

    await Promise.allSettled(sends);

    return json({ ok: true });
  } catch (err) {
    console.error("[notify-booking] Unexpected error:", err);
    return json({ error: String(err) }, 500);
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

Para cada artista (cuando quieras añadirlos):
  PABLO_WA_PHONE   +34XXXXXXXXX
  PABLO_WA_KEY     su_api_key

  SERGIO_WA_PHONE  +34XXXXXXXXX
  SERGIO_WA_KEY    su_api_key
*/

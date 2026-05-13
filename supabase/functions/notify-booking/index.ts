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
// Each artist needs a one-time setup (see README below).
// Secrets stored per artist: PABLO_WA_PHONE, PABLO_WA_KEY, etc.

async function sendWhatsApp(artistId: string, message: string): Promise<void> {
  const key = artistId.toUpperCase();
  const phone  = Deno.env.get(`${key}_WA_PHONE`);
  const apiKey = Deno.env.get(`${key}_WA_KEY`);

  if (!phone || !apiKey) {
    console.warn(`[notify-booking] No WhatsApp config for artist "${artistId}" — skipping`);
    return;
  }

  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.text();
    console.warn(`[notify-booking] CallMeBot error (${res.status}):`, body);
  } else {
    console.log(`[notify-booking] WhatsApp sent to artist "${artistId}"`);
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
    const { artist_id, service, client_name, client_phone, date, description } = await req.json();

    if (!artist_id) {
      return json({ error: "artist_id is required" }, 400);
    }

    const lines = [
      `🔔 Nueva solicitud de ${service ?? "cita"}`,
      ``,
      `👤 ${client_name ?? "Sin nombre"}`,
      `📅 ${date ?? "Fecha no especificada"}`,
      client_phone ? `📞 ${client_phone}` : null,
      description   ? `📝 ${description.slice(0, 120)}${description.length > 120 ? "…" : ""}` : null,
      ``,
      `Ver en la app: https://tattoolowkey.com/admin/bookings`,
    ].filter(Boolean).join("\n");

    await sendWhatsApp(artist_id, lines);

    return json({ ok: true });
  } catch (err) {
    console.error("[notify-booking] Unexpected error:", err);
    return json({ error: String(err) }, 500);
  }
});

/*
── Activación CallMeBot por artista (una sola vez) ────────────────────────────

1. El artista guarda el número +34 623 76 13 63 en sus contactos como "CallMeBot"
2. Le envía el mensaje: "I allow callmebot to send me messages"
3. Recibirá su API key personal por WhatsApp en pocos segundos

Después configura los secretos en Supabase:

  supabase secrets set PABLO_WA_PHONE=+34XXXXXXXXX
  supabase secrets set PABLO_WA_KEY=su_api_key_aqui

  supabase secrets set SERGIO_WA_PHONE=+34XXXXXXXXX
  supabase secrets set SERGIO_WA_KEY=su_api_key_aqui

  supabase secrets set FIFO_WA_PHONE=+34XXXXXXXXX
  supabase secrets set FIFO_WA_KEY=su_api_key_aqui

Y despliega la función:

  supabase functions deploy notify-booking
*/

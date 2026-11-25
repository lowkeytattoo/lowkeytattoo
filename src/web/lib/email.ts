import { supabase } from "@shared/lib/supabase";
import { ARTISTS } from "@shared/config/artists";
import type { ServiceType } from "@shared/types/index";

// Emails are sent server-side by the `send-web-emails` Edge Function so the
// Brevo API key never ships to the browser.

export interface BookingData {
  artistName: string;
  artistEmail: string;
  serviceType: ServiceType;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  date: string;
  time: string;
  description: string;
  bodyZone: string;
  isFirstTime: boolean;
}

/** POST to a Supabase Edge Function with the public anon key. */
export async function callEdgeFunction(name: string, body: unknown): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return;
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) console.warn(`[${name}] falló:`, await res.text());
  } catch (err) {
    console.warn(`[${name}] error:`, err);
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function sendBookingRequest(booking: BookingData): Promise<void> {
  if (!import.meta.env.VITE_SUPABASE_URL) return;

  const artist = ARTISTS.find(
    (a) => a.name === booking.artistName || a.email === booking.artistEmail
  );

  const isoDate = booking.date
    ? booking.date.split("/").reverse().join("-")
    : null;

  // The id is generated here (anon can insert but not read back) and is the
  // only thing sent to the Edge Functions: they read the row server-side and
  // send internal notices WITHOUT client data (RGPD, tickets WEB-02 / INT-01).
  const id = crypto.randomUUID();

  // Awaited: the functions check this row exists before sending.
  const { error } = await supabase.from("web_bookings").insert({
    id,
    artist_config_id: artist?.id ?? null,
    service_type: booking.serviceType,
    client_name: booking.clientName?.trim() || null,
    client_phone: booking.clientPhone?.trim() || null,
    client_email: booking.clientEmail?.trim() || null,
    preferred_date: isoDate,
    preferred_time: booking.time || null,
    description: booking.description || null,
    body_zone: booking.bodyZone || null,
    is_first_time: booking.isFirstTime,
    status: "pending",
  });
  if (error) {
    console.warn("Could not save booking to Supabase:", error.message);
    return;
  }

  await Promise.allSettled([
    // Internal notice to admin + artist, and confirmation to the client
    callEdgeFunction("send-web-emails", { kind: "booking", id }),
    // WhatsApp notice to admin + artist (service, artist, date and REF only)
    callEdgeFunction("notify-booking", { kind: "booking", booking_id: id }),
  ]);
}

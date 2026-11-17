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

const SERVICE_LABELS: Record<string, string> = {
  tattoo: "Tatuaje",
  piercing: "Piercing",
  laser: "Láser",
};

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

  // Awaited: the email function checks this row exists before sending.
  const { error } = await supabase.from("web_bookings").insert({
    artist_config_id: artist?.id ?? null,
    service_type: booking.serviceType,
    client_name: booking.clientName || null,
    client_phone: booking.clientPhone || null,
    client_email: booking.clientEmail || null,
    preferred_date: isoDate,
    preferred_time: booking.time || null,
    description: booking.description || null,
    body_zone: booking.bodyZone || null,
    is_first_time: booking.isFirstTime,
    status: "pending",
  });
  if (error) console.warn("Could not save booking to Supabase:", error.message);

  const serviceLabel = SERVICE_LABELS[booking.serviceType] ?? booking.serviceType;

  const sends: Promise<void>[] = [
    // Emails to admin + artist + client confirmation
    callEdgeFunction("send-web-emails", {
      kind:          "booking",
      artist_id:     artist?.id,
      service_type:  booking.serviceType,
      client_name:   booking.clientName,
      client_phone:  booking.clientPhone,
      client_email:  booking.clientEmail,
      date:          booking.date,
      body_zone:     booking.bodyZone,
      is_first_time: booking.isFirstTime,
      description:   booking.description,
    }),
  ];

  // WhatsApp notification to artist (phone number stays server-side)
  if (artist?.id) {
    sends.push(
      callEdgeFunction("notify-booking", {
        artist_id:    artist.id,
        service:      serviceLabel,
        client_name:  booking.clientName,
        client_phone: booking.clientPhone,
        date:         booking.date,
        body_zone:    booking.bodyZone || undefined,
        description:  booking.description,
      })
    );
  }

  await Promise.allSettled(sends);
}

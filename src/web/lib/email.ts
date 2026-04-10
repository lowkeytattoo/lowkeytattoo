import emailjs from "@emailjs/browser";
import { supabase } from "@shared/lib/supabase";
import { ARTISTS } from "@shared/config/artists";

export interface BookingData {
  artistName: string;
  artistEmail: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  date: string;
  time: string;
  description: string;
  bodyZone: string;
  isFirstTime: boolean;
}

export async function sendBookingRequest(booking: BookingData): Promise<void> {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  // Find artist config id from name
  const artist = ARTISTS.find(
    (a) => a.name === booking.artistName || a.email === booking.artistEmail
  );

  // Convert dd/MM/yyyy → yyyy-MM-dd for Supabase
  const isoDate = booking.date
    ? booking.date.split("/").reverse().join("-")
    : null;

  // Save to Supabase web_bookings (best-effort, don't block email)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    supabase
      .from("web_bookings")
      .insert({
        artist_config_id: artist?.id ?? null,
        client_name: booking.clientName || null,
        client_phone: booking.clientPhone || null,
        client_email: booking.clientEmail || null,
        preferred_date: isoDate,
        preferred_time: booking.time || null,
        description: booking.description || null,
        body_zone: booking.bodyZone || null,
        is_first_time: booking.isFirstTime,
        status: "pending",
      })
      .then(({ error }) => {
        if (error) console.warn("Could not save booking to Supabase:", error.message);
      });
  }

  if (!serviceId || !templateId || !publicKey) {
    console.warn("EmailJS not configured — skipping email send");
    return;
  }

  const params = {
      artist_name: booking.artistName,
      artist_email: booking.artistEmail,
      client_name: booking.clientName,
      client_phone: booking.clientPhone,
      client_email: booking.clientEmail,
      date: booking.date,
      time: booking.time,
      description: booking.description,
      body_zone: booking.bodyZone,
      is_first_time: booking.isFirstTime ? "Sí" : "No",
  };

  await emailjs.send(serviceId, templateId, params, publicKey);
}

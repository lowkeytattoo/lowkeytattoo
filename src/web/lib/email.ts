import { supabase } from "@shared/lib/supabase";
import { ARTISTS } from "@shared/config/artists";
import type { ServiceType } from "@shared/types/index";

const BREVO_API_KEY  = import.meta.env.VITE_BREVO_API_KEY as string;
const ADMIN_EMAIL    = (import.meta.env.VITE_ADMIN_EMAIL as string) || "info@tattoolowkey.com";
const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

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

export async function sendBookingRequest(booking: BookingData): Promise<void> {
  const artist = ARTISTS.find(
    (a) => a.name === booking.artistName || a.email === booking.artistEmail
  );

  // Convert dd/MM/yyyy → yyyy-MM-dd for Supabase
  const isoDate = booking.date
    ? booking.date.split("/").reverse().join("-")
    : null;

  // Save to Supabase (best-effort, don't block email)
  if (import.meta.env.VITE_SUPABASE_URL) {
    supabase
      .from("web_bookings")
      .insert({
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
      })
      .then(({ error }) => {
        if (error) console.warn("Could not save booking to Supabase:", error.message);
      });
  }

  if (!BREVO_API_KEY) {
    console.warn("[email] VITE_BREVO_API_KEY no configurada — no se envían emails");
    return;
  }

  const serviceLabel = SERVICE_LABELS[booking.serviceType] ?? booking.serviceType;
  const subject = `[Lowkey] Nueva solicitud de ${serviceLabel} — ${booking.clientName}`;

  const lines = [
    `Nueva solicitud de cita recibida desde la web.`,
    ``,
    `Servicio: ${serviceLabel}`,
    `Artista: ${booking.artistName}`,
    ``,
    `Cliente: ${booking.clientName}`,
    `Teléfono: ${booking.clientPhone}`,
    `Email: ${booking.clientEmail}`,
    ``,
    `Fecha solicitada: ${booking.date}`,
    booking.time ? `Hora: ${booking.time}` : null,
    `Zona corporal: ${booking.bodyZone}`,
    `Primera vez: ${booking.isFirstTime ? "Sí" : "No"}`,
    ``,
    `Descripción:`,
    booking.description,
    ``,
    `Ver en la app: ${window.location.origin}/admin/bookings`,
  ].filter((l): l is string => l !== null).join("\n");

  const recipients = [
    { email: ADMIN_EMAIL, name: "Admin Lowkey" },
  ];

  // Add artist if different from admin
  const artistEmail = artist?.email ?? booking.artistEmail;
  if (artistEmail && artistEmail !== ADMIN_EMAIL) {
    recipients.push({ email: artistEmail, name: booking.artistName });
  }

  await Promise.allSettled(
    recipients.map((to) =>
      fetch(BREVO_ENDPOINT, {
        method: "POST",
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "Lowkey Tattoo Web", email: "info@tattoolowkey.com" },
          to: [to],
          subject,
          textContent: lines,
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.text();
            console.warn(`[email] Brevo → ${to.email} falló (${res.status}):`, err);
          } else {
            console.log(`[email] Brevo → ${to.email} OK`);
          }
        })
        .catch((err) => console.warn(`[email] Brevo request error → ${to.email}:`, err))
    )
  );
}

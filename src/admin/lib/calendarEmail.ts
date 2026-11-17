import { ARTISTS } from "@shared/config/artists";
import { supabase } from "@shared/lib/supabase";

// Emails go through the `send-web-emails` Edge Function (kind "internal"),
// authenticated with the staff member's session — the Brevo key stays server-side.

// ── Supabase Edge Function (WhatsApp) ─────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type CalendarEmailAction =
  | "Nueva cita en calendario"
  | "Sesión registrada"
  | "Cita modificada"
  | "Cita eliminada"
  | "Reserva confirmada";

export interface CalendarEmailData {
  action: CalendarEmailAction;
  artistId: string;        // "pablo" | "sergio" | "fifo"
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  sessionType?: string;
  eventTitle: string;
  eventDate: string;       // "martes, 22 de abril de 2026"
  eventTime: string;       // "15:00 – 17:00"
  duration?: string;       // "2h 30min"
  bodyZone?: string;
  notes?: string;
  oldDate?: string;        // solo para "Cita modificada"
  oldTime?: string;
  isFirstTime?: boolean;   // solo para reservas web
  adminUrl?: string;
}

// ── Función principal ─────────────────────────────────────────────────────────

/** Envía email al artista y al admin vía Brevo, y WhatsApp al artista + admin vía CallMeBot. */
export async function sendCalendarEmail(data: CalendarEmailData): Promise<void> {
  console.log(`[calendarEmail] llamada → artistId="${data.artistId}" action="${data.action}"`);

  // WhatsApp se lanza siempre, independientemente de Brevo.
  // La Edge Function decide a quién enviar: siempre admin + artista específico.
  if (data.artistId) {
    sendWhatsAppNotify(data).catch((err) =>
      console.warn("[calendarEmail] WhatsApp notify error:", err),
    );
  }

  const artist = ARTISTS.find((a) => a.id === data.artistId);
  if (!artist) {
    console.warn(
      `[calendarEmail] artistId "${data.artistId}" no encontrado en ARTISTS[].` +
      ` IDs disponibles: ${ARTISTS.map((a) => a.id).join(", ")}`,
    );
    return;
  }
  console.log(`[calendarEmail] artista resuelto → ${artist.name} <${artist.email}>`);

  const adminUrl = data.adminUrl ?? `${window.location.origin}/admin/calendar`;

  const lines = [
    `Acción: ${data.action}`,
    `Artista: ${artist.name}`,
    data.clientName  ? `Cliente: ${data.clientName}`  : null,
    data.clientPhone ? `Teléfono: ${data.clientPhone}` : null,
    data.clientEmail ? `Email cliente: ${data.clientEmail}` : null,
    data.sessionType ? `Servicio: ${data.sessionType}` : null,
    `Fecha: ${data.eventDate}`,
    `Hora: ${data.eventTime}`,
    data.duration    ? `Duración: ${data.duration}` : null,
    data.oldDate     ? `Fecha anterior: ${data.oldDate}${data.oldTime ? ` ${data.oldTime}` : ""}` : null,
    data.notes       ? `Notas: ${data.notes}` : null,
    data.isFirstTime !== undefined ? `Primera vez: ${data.isFirstTime ? "Sí" : "No"}` : null,
    "",
    `Ver en la app: ${adminUrl}`,
  ].filter((l): l is string => l !== null).join("\n");

  const subject = `[Lowkey] ${data.action} — ${data.eventTitle} · ${data.eventDate}`;

  await sendInternalEmail(artist.id, subject, lines);
}

// ── WhatsApp vía Edge Function notify-booking ────────────────────────────────

async function sendWhatsAppNotify(data: CalendarEmailData): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;

  const serviceLabel = [data.action, data.sessionType].filter(Boolean).join(" — ");
  const dateLabel    = [data.eventDate, data.eventTime].filter(Boolean).join(" · ");

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/notify-booking`, {
      method: "POST",
      headers: {
        "apikey":        SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        artist_id:    data.artistId,
        service:      serviceLabel,
        client_name:  data.clientName,
        client_phone: data.clientPhone,
        date:         dateLabel,
        body_zone:    data.bodyZone || undefined,
        description:  data.notes,
      }),
    });
    if (!res.ok) console.warn("[calendarEmail] WhatsApp notify falló:", await res.text());
    else         console.log("[calendarEmail] WhatsApp notify OK");
  } catch (err) {
    console.warn("[calendarEmail] WhatsApp notify error:", err);
  }
}

// ── Canal de envío ────────────────────────────────────────────────────────────

async function sendInternalEmail(artistId: string, subject: string, text: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn("[calendarEmail] sin sesión — no se envía email");
    return;
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-web-emails`, {
      method: "POST",
      headers: {
        apikey:          SUPABASE_KEY,
        Authorization:   `Bearer ${session.access_token}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({ kind: "internal", artist_id: artistId, subject, text }),
    });
    if (!res.ok) console.warn("[calendarEmail] email falló:", await res.text());
    else         console.log("[calendarEmail] email OK");
  } catch (err) {
    console.warn("[calendarEmail] email error:", err);
  }
}

// ── Helpers de formato ────────────────────────────────────────────────────────

/** Date → "martes, 22 de abril de 2026" */
export function formatEventDate(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** ISO start + end → "15:00 – 17:00" */
export function formatEventTime(startIso: string, endIso: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return `${fmt(startIso)} – ${fmt(endIso)}`;
}

/** ISO start + end → "2h 30min" */
export function formatDuration(startIso: string, endIso: string): string {
  const minutes = (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

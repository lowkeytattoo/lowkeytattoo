import { ARTISTS } from "@shared/config/artists";

// ── Brevo REST API — 300 emails/día gratis ────────────────────────────────────
const BREVO_API_KEY  = import.meta.env.VITE_BREVO_API_KEY as string;
const ADMIN_EMAIL    = (import.meta.env.VITE_ADMIN_EMAIL as string) || "info@tattoolowkey.com";
const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type CalendarEmailAction =
  | "Nueva cita en calendario"
  | "Sesión registrada"
  | "Cita modificada"
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
  notes?: string;
  oldDate?: string;        // solo para "Cita modificada"
  oldTime?: string;
  isFirstTime?: boolean;   // solo para reservas web
  adminUrl?: string;
}

// ── Función principal ─────────────────────────────────────────────────────────

/** Envía email al artista y al admin vía Brevo. Falla silencioso. */
export async function sendCalendarEmail(data: CalendarEmailData): Promise<void> {
  console.log("[calendarEmail] sendCalendarEmail llamado:", data.action, "| artistId:", data.artistId);
  if (!BREVO_API_KEY) {
    console.warn("[calendarEmail] VITE_BREVO_API_KEY no configurada — no se envían emails");
    return;
  }

  const artist = ARTISTS.find((a) => a.id === data.artistId);
  console.log("[calendarEmail] Artista resuelto:", artist?.name, "→ email:", artist?.email);
  if (!artist) {
    console.warn(`[calendarEmail] Artista no encontrado en ARTISTS[]: ${data.artistId}`);
    return;
  }

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

  const allRecipients = [
    { email: ADMIN_EMAIL, name: "Admin Lowkey" },
    { email: artist.email, name: artist.name },
  ];
  // Dedup: si el artista ES el admin, no duplicar el email
  const seen = new Set<string>();
  const recipients = allRecipients.filter(({ email }) => {
    if (seen.has(email)) return false;
    seen.add(email);
    return true;
  });

  console.log("[calendarEmail] Enviando a:", recipients.map((r) => r.email));
  await Promise.allSettled(
    recipients.map((to) => sendBrevoEmail(to, subject, lines)),
  );
}

// ── Canal de envío ────────────────────────────────────────────────────────────

async function sendBrevoEmail(
  to: { email: string; name: string },
  subject: string,
  textContent: string,
): Promise<void> {
  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender:      { name: "Lowkey Tattoo App", email: "info@tattoolowkey.com" },
        to:          [to],
        subject,
        textContent,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.warn(`[calendarEmail] Brevo → ${to.email} falló (${res.status}):`, err);
    } else {
      console.log(`[calendarEmail] Brevo → ${to.email} OK`);
    }
  } catch (err) {
    console.warn(`[calendarEmail] Brevo request error → ${to.email}:`, err);
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

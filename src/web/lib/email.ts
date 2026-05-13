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

const SERVICE_EMOJI: Record<string, string> = {
  tattoo: "🖋",
  piercing: "💎",
  laser: "✨",
};

// ── HTML Templates ────────────────────────────────────────────────────────────

function baseHtml(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lowkey Tattoo</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo / header -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <p style="margin:0;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#555;font-family:'Courier New',monospace;">LOWKEY TATTOO</p>
              <p style="margin:6px 0 0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#333;font-family:'Courier New',monospace;">Santa Cruz de Tenerife</p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#111;border:1px solid #222;border-radius:4px;padding:32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#333;font-family:'Courier New',monospace;letter-spacing:0.1em;">
                tattoolowkey.com &nbsp;·&nbsp; Calle Dr. Allart, 50
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function row(label: string, value: string): string {
  return `
  <tr>
    <td style="padding:8px 0;border-bottom:1px solid #1e1e1e;">
      <p style="margin:0;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#555;font-family:'Courier New',monospace;">${label}</p>
      <p style="margin:4px 0 0;font-size:14px;color:#e0e0e0;">${value}</p>
    </td>
  </tr>`;
}

function internalNotificationHtml(booking: BookingData, serviceLabel: string): string {
  const emoji = SERVICE_EMOJI[booking.serviceType] ?? "";
  const content = `
    <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#555;font-family:'Courier New',monospace;">Nueva solicitud</p>
    <h1 style="margin:0 0 28px;font-size:22px;font-weight:500;color:#ffffff;">${emoji} ${serviceLabel} — ${booking.clientName}</h1>

    <table width="100%" cellpadding="0" cellspacing="0">
      ${row("Artista", booking.artistName)}
      ${row("Cliente", booking.clientName)}
      ${row("Teléfono", booking.clientPhone)}
      ${row("Email", booking.clientEmail)}
      ${row("Fecha solicitada", booking.date)}
      ${row("Zona corporal", booking.bodyZone)}
      ${row("Primera vez", booking.isFirstTime ? "Sí" : "No")}
    </table>

    <div style="margin-top:20px;padding:16px;background-color:#0d0d0d;border-left:2px solid #333;border-radius:2px;">
      <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#555;font-family:'Courier New',monospace;">Descripción</p>
      <p style="margin:0;font-size:14px;color:#bbb;line-height:1.6;">${booking.description}</p>
    </div>

    <div style="margin-top:28px;text-align:center;">
      <a href="${window.location.origin}/admin/bookings"
         style="display:inline-block;padding:12px 28px;background-color:#ffffff;color:#000000;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;font-family:'Courier New',monospace;border-radius:2px;">
        Ver en la app
      </a>
    </div>
  `;
  return baseHtml(content);
}

function clientConfirmationHtml(booking: BookingData, serviceLabel: string): string {
  const emoji = SERVICE_EMOJI[booking.serviceType] ?? "";
  const content = `
    <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#555;font-family:'Courier New',monospace;">Solicitud recibida</p>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:500;color:#ffffff;">Hola, ${booking.clientName} ${emoji}</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#888;line-height:1.6;">
      Hemos recibido tu solicitud de <strong style="color:#ccc;">${serviceLabel.toLowerCase()}</strong> con <strong style="color:#ccc;">${booking.artistName}</strong>.<br>
      Nos pondremos en contacto contigo en breve para confirmar la cita.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      ${row("Artista", booking.artistName)}
      ${row("Servicio", serviceLabel)}
      ${row("Fecha solicitada", booking.date)}
      ${row("Zona corporal", booking.bodyZone)}
    </table>

    <div style="margin-top:20px;padding:16px;background-color:#0d0d0d;border-left:2px solid #333;border-radius:2px;">
      <p style="margin:0;font-size:13px;color:#666;line-height:1.6;">
        Si tienes alguna pregunta, puedes responder a este email o contactarnos por WhatsApp.
      </p>
    </div>

    <div style="margin-top:28px;text-align:center;">
      <a href="https://tattoolowkey.com"
         style="display:inline-block;padding:12px 28px;background-color:#ffffff;color:#000000;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;font-family:'Courier New',monospace;border-radius:2px;">
        tattoolowkey.com
      </a>
    </div>
  `;
  return baseHtml(content);
}

// ── Brevo send helper ─────────────────────────────────────────────────────────

async function sendBrevoEmail(
  to: { email: string; name: string },
  subject: string,
  htmlContent: string,
): Promise<void> {
  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { name: "Lowkey Tattoo", email: "info@tattoolowkey.com" },
      to: [to],
      subject,
      htmlContent,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.warn(`[email] Brevo → ${to.email} falló (${res.status}):`, err);
  } else {
    console.log(`[email] Brevo → ${to.email} OK`);
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

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
  const artistEmail  = artist?.email ?? booking.artistEmail;

  // Internal recipients: admin + artist (deduped)
  const internalRecipients = [{ email: ADMIN_EMAIL, name: "Admin Lowkey" }];
  if (artistEmail && artistEmail !== ADMIN_EMAIL) {
    internalRecipients.push({ email: artistEmail, name: booking.artistName });
  }

  const internalSubject  = `[Lowkey] Nueva solicitud de ${serviceLabel} — ${booking.clientName}`;
  const internalHtml     = internalNotificationHtml(booking, serviceLabel);
  const clientSubject    = `Tu solicitud en Lowkey Tattoo — ${serviceLabel}`;
  const clientHtml       = clientConfirmationHtml(booking, serviceLabel);

  const sends: Promise<void>[] = [
    // Notify admin + artist
    ...internalRecipients.map((to) =>
      sendBrevoEmail(to, internalSubject, internalHtml).catch((err) =>
        console.warn(`[email] error → ${to.email}:`, err)
      )
    ),
  ];

  // Confirm to client if they provided an email
  if (booking.clientEmail) {
    sends.push(
      sendBrevoEmail(
        { email: booking.clientEmail, name: booking.clientName },
        clientSubject,
        clientHtml,
      ).catch((err) => console.warn("[email] error → client:", err))
    );
  }

  await Promise.allSettled(sends);
}

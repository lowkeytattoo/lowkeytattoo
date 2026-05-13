import { supabase } from "@shared/lib/supabase";
import { ARTISTS } from "@shared/config/artists";
import { CONTACT } from "@web/config/contact";
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

// Hosted as /public/wa-icon.svg so it's served from the production domain.
// <img> with an absolute URL works in Gmail, Apple Mail and most clients
// (unlike inline <svg> which gets stripped by email security filters).
const WA_ICON = `<img src="https://tattoolowkey.com/wa-icon.svg" width="16" height="16" alt="WhatsApp" style="display:inline-block;vertical-align:middle;margin-right:8px;" />`;

// ── Base layout ───────────────────────────────────────────────────────────────

function baseHtml(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Lowkey Tattoo</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:'IBM Plex Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f0;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Wordmark -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <p style="margin:0;font-family:'IBM Plex Mono',monospace;font-size:22px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;color:#111;">LOWKEY TATTOO</p>
              <p style="margin:7px 0 0;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#999;">Santa Cruz de Tenerife</p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff;border:1px solid #e0e0e0;border-radius:6px;padding:36px 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:20px;text-align:center;">
              <p style="margin:0;font-family:'IBM Plex Mono',monospace;font-size:10px;color:#aaa;letter-spacing:0.12em;">
                tattoolowkey.com &nbsp;·&nbsp; Calle Dr. Allart, 50 · Santa Cruz de Tenerife
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

// ── Row ───────────────────────────────────────────────────────────────────────

function row(label: string, value: string): string {
  return `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;vertical-align:top;width:38%;">
      <p style="margin:0;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#999;">${label}</p>
    </td>
    <td style="padding:10px 0 10px 12px;border-bottom:1px solid #f0f0f0;vertical-align:top;">
      <p style="margin:0;font-size:14px;color:#1a1a1a;">${value}</p>
    </td>
  </tr>`;
}

// ── WhatsApp button (matches Hero style: bordered, mono, icon) ────────────────

function waBtn(href: string, label = "WhatsApp"): string {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer"
    style="display:inline-block;padding:11px 22px;border:1px solid #333;border-radius:2px;font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#111;text-decoration:none;white-space:nowrap;"
  >${WA_ICON}${label}</a>`;
}

// ── Internal notification (admin + artist) ────────────────────────────────────

function internalNotificationHtml(booking: BookingData, serviceLabel: string): string {
  const digits = booking.clientPhone.replace(/\D/g, "");
  const clientWaUrl = `https://wa.me/${digits.startsWith("34") || digits.length > 9 ? digits : "34" + digits}`;

  const content = `
    <p style="margin:0 0 2px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#aaa;">Nueva solicitud</p>
    <h1 style="margin:0 0 28px;font-size:20px;font-weight:500;color:#111;font-family:'IBM Plex Sans',Helvetica,Arial,sans-serif;">${serviceLabel} — ${booking.clientName}</h1>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${row("Artista", booking.artistName)}
      ${row("Cliente", booking.clientName)}
      ${row("Teléfono", booking.clientPhone)}
      ${row("Email", booking.clientEmail)}
      ${row("Fecha", booking.date)}
      ${row("Zona", booking.bodyZone)}
      ${row("Primera vez", booking.isFirstTime ? "Sí" : "No")}
    </table>

    <div style="margin-top:20px;padding:16px 18px;background-color:#f8f8f8;border-left:3px solid #ddd;border-radius:0 4px 4px 0;">
      <p style="margin:0 0 6px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#aaa;">Descripción</p>
      <p style="margin:0;font-size:14px;color:#444;line-height:1.65;">${booking.description}</p>
    </div>

    <div style="margin-top:28px;text-align:center;">
      ${waBtn(clientWaUrl, "WhatsApp cliente")}
      <div style="margin-top:10px;">
        <a href="https://tattoolowkey.com/admin/bookings"
           style="display:inline-block;padding:11px 22px;border:1px solid #333;border-radius:2px;font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#111;text-decoration:none;white-space:nowrap;">
          Ver cita
        </a>
      </div>
    </div>
  `;
  return baseHtml(content);
}

// ── Client confirmation ───────────────────────────────────────────────────────

function clientConfirmationHtml(booking: BookingData, serviceLabel: string): string {
  const content = `
    <p style="margin:0 0 2px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#aaa;">Solicitud recibida</p>
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:500;color:#111;font-family:'IBM Plex Sans',Helvetica,Arial,sans-serif;">Hola, ${booking.clientName}</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.65;">
      Hemos recibido tu solicitud de <strong style="color:#111;">${serviceLabel.toLowerCase()}</strong> con <strong style="color:#111;">${booking.artistName}</strong>.
      Nos pondremos en contacto contigo en breve para confirmar disponibilidad y fecha definitiva.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${row("Artista", booking.artistName)}
      ${row("Servicio", serviceLabel)}
      ${row("Fecha solicitada", booking.date)}
      ${row("Zona corporal", booking.bodyZone)}
    </table>

    <div style="margin-top:20px;padding:14px 18px;background-color:#f8f8f8;border-radius:4px;">
      <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
        ¿Tienes alguna pregunta? Puedes responder a este email o escribirnos directamente por WhatsApp.
      </p>
    </div>

    <div style="margin-top:28px;text-align:center;">
      ${waBtn(CONTACT.whatsapp)}
      <div style="margin-top:14px;">
        <a href="https://tattoolowkey.com"
           style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.12em;color:#888;text-decoration:underline;">
          tattoolowkey.com
        </a>
      </div>
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

  const isoDate = booking.date
    ? booking.date.split("/").reverse().join("-")
    : null;

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

  const internalRecipients = [{ email: ADMIN_EMAIL, name: "Admin Lowkey" }];
  if (artistEmail && artistEmail !== ADMIN_EMAIL) {
    internalRecipients.push({ email: artistEmail, name: booking.artistName });
  }

  const sends: Promise<void>[] = [
    // Emails to admin + artist
    ...internalRecipients.map((to) =>
      sendBrevoEmail(
        to,
        `[Lowkey] Nueva solicitud de ${serviceLabel} — ${booking.clientName}`,
        internalNotificationHtml(booking, serviceLabel),
      ).catch((err) => console.warn(`[email] error → ${to.email}:`, err))
    ),
  ];

  // Confirmation email to client
  if (booking.clientEmail) {
    sends.push(
      sendBrevoEmail(
        { email: booking.clientEmail, name: booking.clientName },
        `Tu solicitud en Lowkey Tattoo — ${serviceLabel}`,
        clientConfirmationHtml(booking, serviceLabel),
      ).catch((err) => console.warn("[email] error → client:", err))
    );
  }

  // WhatsApp notification to artist via Edge Function (phone number stays server-side)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (artist?.id && supabaseUrl && supabaseKey) {
    sends.push(
      fetch(`${supabaseUrl}/functions/v1/notify-booking`, {
        method: "POST",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          artist_id:    artist.id,
          service:      serviceLabel,
          client_name:  booking.clientName,
          client_phone: booking.clientPhone,
          date:         booking.date,
          description:  booking.description,
        }),
      })
        .then(async (res) => {
          if (!res.ok) console.warn("[email] WhatsApp notify falló:", await res.text());
        })
        .catch((err) => console.warn("[email] WhatsApp notify error:", err))
    );
  }

  await Promise.allSettled(sends);
}

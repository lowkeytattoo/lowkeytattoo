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

// WhatsApp SVG path (same as Hero/StudioInfo)
const WA_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block;vertical-align:middle;margin-right:8px;" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

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
  >${WA_SVG}${label}</a>`;
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
      <div style="margin-top:12px;">
        <a href="https://tattoolowkey.com/admin/bookings"
           style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.12em;color:#888;text-decoration:underline;">
          Ver cita en la app
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
    ...internalRecipients.map((to) =>
      sendBrevoEmail(
        to,
        `[Lowkey] Nueva solicitud de ${serviceLabel} — ${booking.clientName}`,
        internalNotificationHtml(booking, serviceLabel),
      ).catch((err) => console.warn(`[email] error → ${to.email}:`, err))
    ),
  ];

  if (booking.clientEmail) {
    sends.push(
      sendBrevoEmail(
        { email: booking.clientEmail, name: booking.clientName },
        `Tu solicitud en Lowkey Tattoo — ${serviceLabel}`,
        clientConfirmationHtml(booking, serviceLabel),
      ).catch((err) => console.warn("[email] error → client:", err))
    );
  }

  await Promise.allSettled(sends);
}

// @ts-nocheck — Deno runtime, not Node/browser
//
// send-web-emails — sends the transactional emails for the public website
// (booking request + contact form) so the Brevo API key never reaches the
// browser.
//
// Kinds:
//   booking  — public booking form (admin + artist + client confirmation)
//   contact  — public contact forms (home + blog) → admin only
//   internal — admin panel calendar notices → admin + artist; requires a
//              logged-in staff session (user JWT), never the anon key.
//
// Anti-abuse: public kinds only send if a matching row was inserted in
// `web_bookings` during the last 10 minutes (checked with the service role),
// and recipients always come from the server-side map below, so it can't be
// used as an open relay.
//
// Secrets (Supabase Dashboard → Project Settings → Edge Functions):
//   BREVO_API_KEY   xkeysib-...       (the NEW, rotated key)
//   ADMIN_EMAIL     info@tattoolowkey.com   (optional, this is the default)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
//
// Deploy:  supabase functions deploy send-web-emails

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

// Server-side recipient map — the client can only pick an artist id,
// never an arbitrary email address.
const ARTISTS: Record<string, { name: string; email: string }> = {
  pablo:  { name: "Pablo Matos",   email: "pablo@tattoolowkey.com" },
  sergio: { name: "Sergio",        email: "sergio@tattoolowkey.com" },
  fifo:   { name: "Fifo",          email: "fifo@tattoolowkey.com" },
  info:   { name: "Lowkey Tattoo", email: "info@tattoolowkey.com" },
};

const SERVICE_LABELS: Record<string, string> = {
  tattoo: "Tatuaje",
  piercing: "Piercing",
  laser: "Láser",
};

const STUDIO_WA = "https://wa.me/34685314986";

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clip(v: unknown, max: number): string {
  return String(v ?? "").slice(0, max);
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

async function recentRowExists(name: string, field: "client_email" | "client_phone", value: string): Promise<boolean> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return false;
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const qs = new URLSearchParams({
    select: "id",
    client_name: `eq.${name}`,
    [field]: `eq.${value}`,
    created_at: `gte.${since}`,
    limit: "1",
  });
  const res = await fetch(`${url}/rest/v1/web_bookings?${qs}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return false;
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0;
}

/** True only for a real logged-in user (staff), not the public anon key. */
async function isStaffRequest(req: Request): Promise<boolean> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const auth = req.headers.get("Authorization") ?? "";
  if (!url || !key || !auth.startsWith("Bearer ")) return false;
  const res = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: auth } });
  if (!res.ok) return false;
  const user = await res.json();
  return typeof user?.id === "string";
}

async function sendBrevo(payload: Record<string, unknown>): Promise<void> {
  const apiKey = Deno.env.get("BREVO_API_KEY");
  if (!apiKey) {
    console.warn("[send-web-emails] BREVO_API_KEY not set");
    return;
  }
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) console.warn("[send-web-emails] Brevo failed:", res.status, await res.text());
}

// ── Templates (ported from src/web/lib/email.ts, now HTML-escaped) ────────────

const WA_ICON = `<img src="https://tattoolowkey.com/wa-icon.svg" width="16" height="16" alt="WhatsApp" style="display:inline-block;vertical-align:middle;margin-right:8px;" />`;

function baseHtml(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Lowkey Tattoo</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:'IBM Plex Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f0;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <p style="margin:0;font-family:'IBM Plex Mono',monospace;font-size:22px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;color:#111;">LOWKEY TATTOO</p>
              <p style="margin:7px 0 0;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#999;">Santa Cruz de Tenerife</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;border:1px solid #e0e0e0;border-radius:6px;padding:36px 32px;">
              ${content}
            </td>
          </tr>
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

function row(label: string, value: string): string {
  return `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;vertical-align:top;width:38%;">
      <p style="margin:0;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#999;">${esc(label)}</p>
    </td>
    <td style="padding:10px 0 10px 12px;border-bottom:1px solid #f0f0f0;vertical-align:top;">
      <p style="margin:0;font-size:14px;color:#1a1a1a;">${esc(value)}</p>
    </td>
  </tr>`;
}

function waBtn(href: string, label = "WhatsApp"): string {
  return `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer"
    style="display:inline-block;padding:11px 22px;border:1px solid #333;border-radius:2px;font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#111;text-decoration:none;white-space:nowrap;"
  >${WA_ICON}${esc(label)}</a>`;
}

interface Booking {
  artistName: string;
  serviceLabel: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  date: string;
  bodyZone: string;
  isFirstTime: boolean;
  description: string;
}

function internalHtml(b: Booking): string {
  const digits = b.clientPhone.replace(/\D/g, "");
  const clientWaUrl = `https://wa.me/${digits.startsWith("34") || digits.length > 9 ? digits : "34" + digits}`;
  return baseHtml(`
    <p style="margin:0 0 2px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#aaa;">Nueva solicitud</p>
    <h1 style="margin:0 0 28px;font-size:20px;font-weight:500;color:#111;">${esc(b.serviceLabel)} — ${esc(b.clientName)}</h1>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${row("Artista", b.artistName)}
      ${row("Cliente", b.clientName)}
      ${row("Teléfono", b.clientPhone)}
      ${row("Email", b.clientEmail)}
      ${row("Fecha", b.date)}
      ${row("Zona", b.bodyZone)}
      ${row("Primera vez", b.isFirstTime ? "Sí" : "No")}
    </table>
    <div style="margin-top:20px;padding:16px 18px;background-color:#f8f8f8;border-left:3px solid #ddd;border-radius:0 4px 4px 0;">
      <p style="margin:0 0 6px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#aaa;">Descripción</p>
      <p style="margin:0;font-size:14px;color:#444;line-height:1.65;">${esc(b.description)}</p>
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
  `);
}

function clientHtml(b: Booking): string {
  return baseHtml(`
    <p style="margin:0 0 2px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#aaa;">Solicitud recibida</p>
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:500;color:#111;">Hola, ${esc(b.clientName)}</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.65;">
      Hemos recibido tu solicitud de <strong style="color:#111;">${esc(b.serviceLabel.toLowerCase())}</strong> con <strong style="color:#111;">${esc(b.artistName)}</strong>.
      Nos pondremos en contacto contigo en breve para confirmar disponibilidad y fecha definitiva.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${row("Artista", b.artistName)}
      ${row("Servicio", b.serviceLabel)}
      ${row("Fecha solicitada", b.date)}
      ${row("Zona corporal", b.bodyZone)}
    </table>
    <div style="margin-top:20px;padding:14px 18px;background-color:#f8f8f8;border-radius:4px;">
      <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
        ¿Tienes alguna pregunta? Puedes responder a este email o escribirnos directamente por WhatsApp.
      </p>
    </div>
    <div style="margin-top:28px;text-align:center;">
      ${waBtn(STUDIO_WA)}
      <div style="margin-top:14px;">
        <a href="https://tattoolowkey.com" style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.12em;color:#888;text-decoration:underline;">tattoolowkey.com</a>
      </div>
    </div>
    <p style="margin:28px 0 0;font-size:11px;color:#aaa;line-height:1.6;">
      Responsable: Lowkey Tattoo. Tratamos tus datos para gestionar tu solicitud de cita.
      Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad en info@tattoolowkey.com.
      Más información en https://tattoolowkey.com/politica-de-privacidad
    </p>
  `);
}

// ── Handler ───────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const adminEmail = Deno.env.get("ADMIN_EMAIL") ?? "info@tattoolowkey.com";
    const sender = { name: "Lowkey Tattoo", email: "info@tattoolowkey.com" };

    // ── Contact form ──────────────────────────────────────────────────────────
    if (body.kind === "contact") {
      const name    = clip(body.name, 120).trim();
      const contact = clip(body.contact, 160).trim();
      const message = clip(body.message, 4000);
      if (!name || !contact) return json({ error: "Missing fields" }, 400);

      const field = contact.includes("@") ? "client_email" : "client_phone";
      if (!(await recentRowExists(name, field, contact))) return json({ error: "Not found" }, 403);

      await sendBrevo({
        sender: { ...sender, name: "Lowkey Tattoo Web" },
        to: [{ email: adminEmail, name: "Admin Lowkey" }],
        subject: body.source === "blog"
          ? `[Lowkey] Nuevo contacto desde blog — ${name}`
          : `[Lowkey] Nuevo mensaje de contacto — ${name}`,
        textContent: [
          body.source === "blog" ? "Nuevo mensaje de contacto desde el blog." : "Nuevo mensaje de contacto desde la web.",
          "",
          `Nombre: ${name}`,
          `Contacto: ${contact}`,
          "",
          "Mensaje:",
          message,
          "",
          "Ver en la app: https://tattoolowkey.com/admin/bookings",
        ].join("\n"),
      });
      return json({ ok: true });
    }

    // ── Booking request ───────────────────────────────────────────────────────
    if (body.kind === "booking") {
      const artist = ARTISTS[String(body.artist_id ?? "")] ?? ARTISTS.info;
      const b: Booking = {
        artistName:   artist.name,
        serviceLabel: SERVICE_LABELS[String(body.service_type)] ?? "Cita",
        clientName:   clip(body.client_name, 120).trim(),
        clientPhone:  clip(body.client_phone, 40).trim(),
        clientEmail:  clip(body.client_email, 160).trim(),
        date:         clip(body.date, 40),
        bodyZone:     clip(body.body_zone, 60),
        isFirstTime:  Boolean(body.is_first_time),
        description:  clip(body.description, 4000),
      };
      if (!b.clientName || !isEmail(b.clientEmail)) return json({ error: "Missing fields" }, 400);
      if (!(await recentRowExists(b.clientName, "client_email", b.clientEmail))) {
        return json({ error: "Not found" }, 403);
      }

      const internal = [{ email: adminEmail, name: "Admin Lowkey" }];
      if (artist.email !== adminEmail) internal.push({ email: artist.email, name: artist.name });

      await Promise.allSettled([
        ...internal.map((to) =>
          sendBrevo({
            sender,
            to: [to],
            subject: `[Lowkey] Nueva solicitud de ${b.serviceLabel} — ${b.clientName}`,
            htmlContent: internalHtml(b),
          })
        ),
        sendBrevo({
          sender,
          to: [{ email: b.clientEmail, name: b.clientName }],
          subject: `Tu solicitud en Lowkey Tattoo — ${b.serviceLabel}`,
          htmlContent: clientHtml(b),
        }),
      ]);
      return json({ ok: true });
    }

    // ── Admin panel notices (staff only) ──────────────────────────────────────
    if (body.kind === "internal") {
      if (!(await isStaffRequest(req))) return json({ error: "Unauthorized" }, 401);
      const artist = ARTISTS[String(body.artist_id ?? "")];
      if (!artist) return json({ error: "Unknown artist" }, 400);
      const recipients = [{ email: adminEmail, name: "Admin Lowkey" }];
      if (artist.email !== adminEmail) recipients.push({ email: artist.email, name: artist.name });
      await Promise.allSettled(
        recipients.map((to) =>
          sendBrevo({
            sender: { ...sender, name: "Lowkey Tattoo App" },
            to: [to],
            subject: clip(body.subject, 300),
            textContent: clip(body.text, 8000),
          })
        ),
      );
      return json({ ok: true });
    }

    return json({ error: "Unknown kind" }, 400);
  } catch (err) {
    console.error("[send-web-emails] Unexpected error:", err);
    return json({ error: "Internal error" }, 500);
  }
});

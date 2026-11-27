// @ts-nocheck — Deno runtime, not Node/browser
//
// send-consent-copy — envía al cliente, SOLO si lo pide, una copia de su
// consentimiento firmado (RGPD, consentimientos Fase 2).
//
//   POST { consent_id }   con la sesión del equipo (JWT de usuario)
//
// - Comprueba con la sesión del usuario (RLS) que puede ver ese consentimiento
//   y que está vigente ("firmado").
// - El destinatario es siempre el email de la ficha del cliente: el panel no
//   puede indicar otra dirección.
// - Envía un enlace temporal de 7 días al PDF (nunca el PDF adjunto ni la foto
//   del documento del representante).
// - Deja constancia en consent_copy_log (canal, quién, cuándo).
//
// Secretos: BREVO_API_KEY (ya existe). SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
// se inyectan solos.  Deploy: supabase functions deploy send-consent-copy

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const LINK_SECONDS = 7 * 24 * 60 * 60;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TYPE_LABEL: Record<string, string> = { tattoo: "tatuaje", piercing: "piercing", laser: "láser" };

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const esc = (v: unknown) =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const brevo = Deno.env.get("BREVO_API_KEY");
  const auth = req.headers.get("Authorization") ?? "";
  if (!url || !service || !brevo) return json({ error: "Server not configured" }, 500);

  try {
    const { consent_id } = await req.json();
    if (typeof consent_id !== "string" || !UUID_RE.test(consent_id)) return json({ error: "Bad request" }, 400);

    // 1. Usuario real del equipo
    const userRes = await fetch(`${url}/auth/v1/user`, { headers: { apikey: service, Authorization: auth } });
    if (!userRes.ok) return json({ error: "Unauthorized" }, 401);
    const user = await userRes.json();
    if (typeof user?.id !== "string") return json({ error: "Unauthorized" }, 401);

    // 2. El consentimiento, leído CON la sesión del usuario: RLS decide si tiene acceso
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? req.headers.get("apikey") ?? "";
    const cfRes = await fetch(
      `${url}/rest/v1/consent_forms?select=id,client_id,type,status,signed_at,pdf_storage_path&id=eq.${consent_id}`,
      { headers: { apikey: anonKey, Authorization: auth } },
    );
    const rows = cfRes.ok ? await cfRes.json() : [];
    const cf = Array.isArray(rows) ? rows[0] : null;
    if (!cf) return json({ error: "Not found" }, 404);
    if (cf.status !== "firmado") return json({ error: "Solo se puede enviar un consentimiento vigente" }, 409);
    if (!cf.pdf_storage_path) return json({ error: "El consentimiento no tiene PDF" }, 409);

    // 3. Email del cliente (siempre el de su ficha)
    const clRes = await fetch(`${url}/rest/v1/clients?select=name,email&id=eq.${cf.client_id}`, {
      headers: { apikey: service, Authorization: `Bearer ${service}` },
    });
    const client = (await clRes.json())?.[0];
    const email = String(client?.email ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "El cliente no tiene un email válido en su ficha" }, 409);

    // 4. Enlace temporal (7 días) al PDF
    const signRes = await fetch(`${url}/storage/v1/object/sign/consent-documents/${cf.pdf_storage_path}`, {
      method: "POST",
      headers: { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: LINK_SECONDS }),
    });
    if (!signRes.ok) return json({ error: "No se pudo generar el enlace" }, 500);
    const { signedURL } = await signRes.json();
    const link = `${url}/storage/v1${signedURL}`;

    const tipo = TYPE_LABEL[cf.type] ?? "procedimiento";
    const fecha = cf.signed_at ? new Date(cf.signed_at).toLocaleDateString("es-ES", { timeZone: "Atlantic/Canary" }) : "";

    // 5. Email
    const html = `<!DOCTYPE html><html lang="es"><body style="margin:0;padding:32px 16px;background:#f0f0f0;font-family:Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="100%" style="max-width:560px;background:#fff;border:1px solid #e0e0e0;border-radius:6px;padding:32px;">
<tr><td>
<p style="margin:0 0 4px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#999;">Lowkey Tattoo</p>
<h1 style="margin:0 0 16px;font-size:20px;font-weight:500;color:#111;">Tu consentimiento informado</h1>
<p style="font-size:15px;color:#444;line-height:1.6;">Hola ${esc(client?.name ?? "")}, como nos pediste, te enviamos una copia de tu consentimiento informado de <strong>${esc(tipo)}</strong>${fecha ? ` firmado el ${esc(fecha)}` : ""}.</p>
<p style="text-align:center;margin:28px 0;"><a href="${esc(link)}" style="display:inline-block;padding:12px 24px;border:1px solid #333;border-radius:2px;color:#111;text-decoration:none;font-size:13px;letter-spacing:.1em;text-transform:uppercase;">Descargar PDF</a></p>
<p style="font-size:13px;color:#777;line-height:1.6;">Por seguridad, el enlace caduca en 7 días. Si necesitas otra copia más adelante, pídenosla en info@tattoolowkey.com.</p>
<p style="font-size:11px;color:#aaa;line-height:1.6;margin-top:24px;">Responsable: Pablo Matos Rodríguez (Lowkey Tattoo). Este documento contiene datos de salud: guárdalo en un lugar seguro y no lo reenvíes. Más información: tattoolowkey.com/politica-de-privacidad</p>
</td></tr></table></td></tr></table></body></html>`;

    const send = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": brevo, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: "Lowkey Tattoo", email: "info@tattoolowkey.com" },
        to: [{ email, name: client?.name ?? undefined }],
        subject: "Tu consentimiento informado — Lowkey Tattoo",
        htmlContent: html,
      }),
    });
    if (!send.ok) {
      console.warn("[send-consent-copy] Brevo failed:", send.status, await send.text());
      return json({ error: "No se pudo enviar el email" }, 502);
    }

    // 6. Constancia del envío
    const logRes = await fetch(`${url}/rest/v1/consent_copy_log`, {
      method: "POST",
      headers: { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ consent_id: cf.id, channel: "email", sent_by: user.id }),
    });
    if (!logRes.ok) console.warn("[send-consent-copy] log failed:", logRes.status);

    return json({ ok: true });
  } catch (err) {
    console.error("[send-consent-copy] error:", err);
    return json({ error: "Internal error" }, 500);
  }
});

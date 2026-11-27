import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@shared/lib/supabase";
import type { ConsentForm, ConsentFormInsert } from "@shared/types/index";

export function useConsentForms(clientId: string) {
  return useQuery({
    queryKey: ["consent_forms", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consent_forms")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ConsentForm[];
    },
    enabled: !!clientId,
  });
}

export function useCreateConsentForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ConsentFormInsert) => {
      const { data, error } = await supabase
        .from("consent_forms")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as ConsentForm;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["consent_forms", data.client_id] });
    },
  });
}

// ── Anulación y borrado (RGPD paquete 2) ──────────────────────────────────────
// Un consentimiento firmado no se modifica ni se borra directamente:
//   1. cualquier miembro del equipo con acceso solicita la anulación (motivo);
//   2. un dueño la aprueba (ANULADO) o la rechaza (vuelve a FIRMADO);
//   3. solo un consentimiento ANULADO puede borrarlo un dueño, con motivo,
//      y el borrado queda en consent_deletion_log.
// Las reglas viven en la base de datos (funciones SQL + RLS), no solo aquí.

// Las funciones SQL no están en el tipo Database generado: llamada tipada a mano.
type RpcResult = { error: { message: string } | null };
const rpc = (fn: string, args: Record<string, unknown>): Promise<RpcResult> =>
  (supabase as unknown as { rpc: (f: string, a: Record<string, unknown>) => Promise<RpcResult> }).rpc(fn, args);

export function useRequestConsentAnnulment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason, clientId }: { id: string; reason: string; clientId: string }) => {
      const { error } = await rpc("request_consent_annulment", { p_id: id, p_reason: reason });
      if (error) throw new Error(error.message);
      return clientId;
    },
    onSuccess: (clientId) => {
      qc.invalidateQueries({ queryKey: ["consent_forms", clientId] });
      qc.invalidateQueries({ queryKey: ["consent-annulments-pending"] });
    },
  });
}

export function useResolveConsentAnnulment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approve, clientId }: { id: string; approve: boolean; clientId: string }) => {
      const { error } = await rpc("resolve_consent_annulment", { p_id: id, p_approve: approve });
      if (error) throw new Error(error.message);
      return clientId;
    },
    onSuccess: (clientId) => {
      qc.invalidateQueries({ queryKey: ["consent_forms", clientId] });
      qc.invalidateQueries({ queryKey: ["consent-annulments-pending"] });
    },
  });
}

export function useDeleteAnnulledConsent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, storagePath, extraPaths = [], reason, clientId }: { id: string; storagePath: string | null; extraPaths?: string[]; reason: string; clientId: string }) => {
      if (reason.trim().length < 5) throw new Error("Indica el motivo del borrado");
      // Adjuntos (foto del documento del representante): mismas reglas que el PDF
      if (extraPaths.length > 0) {
        const { error } = await supabase.storage.from("consent-documents").remove(extraPaths);
        if (error) throw error;
      }
      // 1. PDF: Storage solo lo permite a dueños y si el consentimiento está ANULADO.
      //    Si la política lo bloquea, remove() no da error pero devuelve 0 archivos.
      if (storagePath) {
        const { data, error } = await supabase.storage.from("consent-documents").remove([storagePath]);
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("No se pudo borrar el PDF (¿está anulado y eres dueño?)");
      }
      // 2. Fila + registro del borrado (función SQL; comprueba de nuevo dueño + ANULADO)
      const { error } = await rpc("delete_annulled_consent", { p_id: id, p_reason: reason });
      if (error) throw new Error(error.message);
      return clientId;
    },
    onSuccess: (clientId) => {
      qc.invalidateQueries({ queryKey: ["consent_forms", clientId] });
    },
  });
}

/** Solicitudes de anulación pendientes (para el aviso de los dueños). */
export function usePendingAnnulments(enabled: boolean) {
  return useQuery({
    queryKey: ["consent-annulments-pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consent_forms")
        .select("id, client_id, type, annul_reason, annul_requested_at, clients(name)")
        .eq("status", "anulacion_solicitada")
        .order("annul_requested_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as {
        id: string;
        client_id: string;
        type: string;
        annul_reason: string | null;
        annul_requested_at: string | null;
        clients: { name: string } | null;
      }[];
    },
    enabled,
    refetchInterval: 60_000,
  });
}

export function useOpenConsentPdf() {
  return useMutation({
    mutationFn: async (storagePath: string) => {
      const { data, error } = await supabase.storage
        .from("consent-documents")
        .download(storagePath);
      if (error) throw error;
      return URL.createObjectURL(data);
    },
  });
}

export function useDownloadConsentPdf() {
  return useMutation({
    mutationFn: async (storagePath: string) => {
      const { data, error } = await supabase.storage
        .from("consent-documents")
        .download(storagePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = storagePath.split("/").pop() ?? "consentimiento.pdf";
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}

const COPY_LINK_SECONDS = 7 * 24 * 60 * 60; // enlace de la copia: 7 días (decisión 28/11/2026)

export function useShareConsentWhatsApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      consentId,
      storagePath,
      clientPhone,
      clientName,
    }: {
      consentId: string;
      storagePath: string;
      clientPhone: string;
      clientName: string;
    }) => {
      const { data, error } = await supabase.storage
        .from("consent-documents")
        .createSignedUrl(storagePath, COPY_LINK_SECONDS);
      if (error) throw error;
      const msg =
        `Hola ${clientName}! Te enviamos una copia de tu consentimiento informado firmado en Lowkey Tattoo Tenerife. ` +
        `Puedes descargarlo con este enlace (válido 7 días). Contiene datos de salud: guárdalo en un lugar seguro.\n${data.signedUrl}`;
      const phone = clientPhone.startsWith("+") || clientPhone.startsWith("00")
        ? clientPhone.replace(/\D/g, "")
        : "34" + clientPhone.replace(/\D/g, "");
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
      // Constancia (no bloquea el envío si falla)
      try { await rpc("log_consent_copy", { p_consent_id: consentId, p_channel: "whatsapp" }); } catch { /* la constancia no bloquea el envío */ }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["consent-copy-log"] }),
  });
}

export function useShareConsentGmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      consentId,
      storagePath,
      clientEmail,
      clientName,
      consentType,
    }: {
      consentId: string;
      storagePath: string;
      clientEmail: string;
      clientName: string;
      consentType: string;
    }) => {
      const { data, error } = await supabase.storage
        .from("consent-documents")
        .createSignedUrl(storagePath, COPY_LINK_SECONDS);
      if (error) throw error;
      const subject = `Tu consentimiento informado — Lowkey Tattoo Tenerife`;
      const body = [
        `Hola ${clientName},`,
        ``,
        `Te enviamos el enlace para descargar tu consentimiento informado de ${consentType} firmado en Lowkey Tattoo Tenerife.`,
        ``,
        `Enlace de descarga (válido 7 días). Contiene datos de salud: guárdalo en un lugar seguro.`,
        data.signedUrl,
        ``,
        `Gracias por confiar en nosotros.`,
        `Lowkey Tattoo Tenerife`,
        `Calle Dr. Allart, 50 · 38003 Santa Cruz de Tenerife`,
        `+34 685 31 49 86 · tattoolowkey.com`,
      ].join("\n");
      const url =
        `https://mail.google.com/mail/?view=cm&fs=1` +
        `&to=${encodeURIComponent(clientEmail)}` +
        `&su=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;
      window.open(url, "_blank");
      try { await rpc("log_consent_copy", { p_consent_id: consentId, p_channel: "gmail" }); } catch { /* la constancia no bloquea el envío */ }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["consent-copy-log"] }),
  });
}

// ── Copia por email (servidor) y registros de la Fase 2 ───────────────────────

/** Envía la copia al email de la ficha del cliente desde el servidor (Brevo) y lo registra. */
export function useSendConsentCopyEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (consentId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesión caducada: vuelve a iniciar sesión");
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-consent-copy`, {
        method: "POST",
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ consent_id: consentId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? "No se pudo enviar la copia");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["consent-copy-log"] }),
  });
}

export interface ConsentCopyLogEntry { id: string; consent_id: string; channel: "email" | "whatsapp" | "gmail"; sent_by: string | null; sent_at: string }
export interface ImageWithdrawal { id: string; consent_id: string; permission: string; note: string | null; recorded_by: string | null; withdrawn_at: string }

// Tablas fuera del tipo Database generado: cliente sin tipar solo para ellas.
const db = supabase as unknown as SupabaseClient;

export function useConsentCopyLog(consentIds: string[]) {
  return useQuery({
    queryKey: ["consent-copy-log", consentIds],
    enabled: consentIds.length > 0,
    queryFn: async () => {
      const { data, error } = await db
        .from("consent_copy_log")
        .select("id, consent_id, channel, sent_by, sent_at")
        .in("consent_id", consentIds)
        .order("sent_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ConsentCopyLogEntry[];
    },
  });
}

export function useImageWithdrawals(consentIds: string[]) {
  return useQuery({
    queryKey: ["consent-image-withdrawals", consentIds],
    enabled: consentIds.length > 0,
    queryFn: async () => {
      const { data, error } = await db
        .from("consent_image_withdrawals")
        .select("id, consent_id, permission, note, recorded_by, withdrawn_at")
        .in("consent_id", consentIds);
      if (error) throw error;
      return (data ?? []) as ImageWithdrawal[];
    },
  });
}

export function useRecordImageWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ consentId, permissions, note }: { consentId: string; permissions: string[]; note: string }) => {
      for (const p of permissions) {
        const { error } = await rpc("record_image_withdrawal", { p_consent_id: consentId, p_permission: p, p_note: note });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["consent-image-withdrawals"] }),
  });
}

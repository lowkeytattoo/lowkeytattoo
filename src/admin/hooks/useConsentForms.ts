import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@shared/lib/supabase";
import type { ConsentForm } from "@shared/types/index";

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
    mutationFn: async (payload: Omit<ConsentForm, "id" | "created_at" | "status" | "annul_reason" | "annul_requested_by" | "annul_requested_at" | "annul_resolved_by" | "annul_resolved_at">) => {
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
    mutationFn: async ({ id, storagePath, reason, clientId }: { id: string; storagePath: string | null; reason: string; clientId: string }) => {
      if (reason.trim().length < 5) throw new Error("Indica el motivo del borrado");
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

export function useShareConsentWhatsApp() {
  return useMutation({
    mutationFn: async ({
      storagePath,
      clientPhone,
      clientName,
    }: {
      storagePath: string;
      clientPhone: string;
      clientName: string;
    }) => {
      const { data, error } = await supabase.storage
        .from("consent-documents")
        .createSignedUrl(storagePath, 86400);
      if (error) throw error;
      const msg =
        `Hola ${clientName}! Te enviamos una copia de tu consentimiento informado firmado en Lowkey Tattoo Tenerife. ` +
        `Puedes descargarlo con este enlace (válido 24 horas):\n${data.signedUrl}`;
      const phone = clientPhone.startsWith("+") || clientPhone.startsWith("00")
        ? clientPhone.replace(/\D/g, "")
        : "34" + clientPhone.replace(/\D/g, "");
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
    },
  });
}

export function useShareConsentGmail() {
  return useMutation({
    mutationFn: async ({
      storagePath,
      clientEmail,
      clientName,
      consentType,
    }: {
      storagePath: string;
      clientEmail: string;
      clientName: string;
      consentType: string;
    }) => {
      const { data, error } = await supabase.storage
        .from("consent-documents")
        .createSignedUrl(storagePath, 86400);
      if (error) throw error;
      const subject = `Tu consentimiento informado — Lowkey Tattoo Tenerife`;
      const body = [
        `Hola ${clientName},`,
        ``,
        `Te enviamos el enlace para descargar tu consentimiento informado de ${consentType} firmado en Lowkey Tattoo Tenerife.`,
        ``,
        `Enlace de descarga (válido 24 horas):`,
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
    },
  });
}

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
    mutationFn: async (payload: Omit<ConsentForm, "id" | "created_at">) => {
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

export function useDeleteConsentForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, storagePath, clientId }: { id: string; storagePath: string | null; clientId: string }) => {
      if (storagePath) {
        await supabase.storage.from("consent-documents").remove([storagePath]);
      }
      const { error } = await supabase.from("consent_forms").delete().eq("id", id);
      if (error) throw error;
      return clientId;
    },
    onSuccess: (clientId) => {
      qc.invalidateQueries({ queryKey: ["consent_forms", clientId] });
    },
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
        `+34 674 11 61 89 · tattoolowkey.com`,
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

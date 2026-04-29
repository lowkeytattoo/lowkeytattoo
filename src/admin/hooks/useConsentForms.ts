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

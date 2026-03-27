import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@shared/lib/supabase";
import type { Client } from "@shared/types/index";

export const useClientCoverPhotos = () => {
  return useQuery({
    queryKey: ["client-cover-photos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_photos")
        .select("client_id, storage_path")
        .eq("is_cover", true);
      if (error) throw error;
      const withUrls = await Promise.all(
        (data ?? []).map(async (photo) => {
          const { data: signed } = await supabase.storage
            .from("client-photos")
            .createSignedUrl(photo.storage_path, 3600);
          return { clientId: photo.client_id, url: signed?.signedUrl ?? "" };
        })
      );
      return Object.fromEntries(
        withUrls.filter((p) => p.url).map(({ clientId, url }) => [clientId, url])
      ) as Record<string, string>;
    },
  });
};

export const useSetCoverPhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ photoId, clientId }: { photoId: string; clientId: string }) => {
      await supabase.from("client_photos").update({ is_cover: false }).eq("client_id", clientId);
      const { error } = await supabase.from("client_photos").update({ is_cover: true }).eq("id", photoId);
      if (error) throw error;
    },
    onSuccess: (_data, { clientId }) => {
      qc.invalidateQueries({ queryKey: ["client-photos", clientId] });
      qc.invalidateQueries({ queryKey: ["client-cover-photos"] });
    },
  });
};

export const useClients = (artistId?: string) => {
  return useQuery({
    queryKey: ["clients", artistId],
    queryFn: async () => {
      let query = supabase
        .from("clients")
        .select("*, primary_artist:profiles(id, display_name)")
        .order("name");
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useClient = (id: string) => {
  return useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*, primary_artist:profiles(id, display_name)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (client: Omit<Client, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("clients").insert(client).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
};

export const useUpdateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Client> & { id: string }) => {
      const { data, error } = await supabase
        .from("clients")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["client", id] });
    },
  });
};

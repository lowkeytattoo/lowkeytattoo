import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@shared/lib/supabase";
import type { Session, SessionWithRelations } from "@shared/types/index";

interface SessionFilters {
  artistId?: string;
  clientId?: string;
  from?: string;
  to?: string;
  type?: string;
  paid?: boolean;
  enabled?: boolean;
}

export const useSessions = (filters: SessionFilters = {}) => {
  const { enabled = true, ...queryFilters } = filters;
  return useQuery({
    queryKey: ["sessions", queryFilters],
    enabled,
    queryFn: async () => {
      let query = supabase
        .from("sessions")
        .select("*, client:clients(id, name), artist:profiles(id, display_name)")
        .order("date", { ascending: false });

      if (queryFilters.artistId) query = query.eq("artist_id", queryFilters.artistId);
      if (queryFilters.clientId) query = query.eq("client_id", queryFilters.clientId);
      if (queryFilters.from) query = query.gte("date", queryFilters.from);
      if (queryFilters.to) query = query.lte("date", queryFilters.to);
      if (queryFilters.type) query = query.eq("type", queryFilters.type);
      if (queryFilters.paid !== undefined) query = query.eq("paid", queryFilters.paid);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as SessionWithRelations[];
    },
  });
};

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["sessions"] });
  qc.invalidateQueries({ queryKey: ["finances-overview"] });
  qc.invalidateQueries({ queryKey: ["revenue-by-month"] });
  qc.invalidateQueries({ queryKey: ["unpaid-sessions"] });
};

export const useCreateSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (session: Omit<Session, "id" | "created_at">) => {
      const { data, error } = await supabase.from("sessions").insert(session).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateAll(qc),
  });
};

export const useUpdateSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Session> & { id: string }) => {
      const { data, error } = await supabase
        .from("sessions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateAll(qc),
  });
};

export const useDeleteSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(qc),
  });
};

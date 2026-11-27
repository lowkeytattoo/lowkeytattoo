import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@shared/lib/supabase";

// Registro de actividad (auditoría) y revisión anual de conservación.
// SQL: supabase/2026-11-28_auditoria_y_revision_anual.sql
// Tablas y funciones fuera del tipo Database generado: cliente sin tipar.
const db = supabase as unknown as SupabaseClient;

const rpcOrThrow = async <T,>(fn: string, args?: Record<string, unknown>): Promise<T> => {
  const { data, error } = await db.rpc(fn, args ?? {});
  if (error) throw new Error(error.message);
  return data as T;
};

// ── Registro de actividad ────────────────────────────────────────────────────

export interface AuditEvent {
  id: number;
  at: string;
  actor: string | null;
  action: "insert" | "update" | "delete" | "view" | "download" | "purge";
  table_name: string;
  record_id: string | null;
  client_id: string | null;
  changed_fields: string[] | null;
  detail: string | null;
}

export interface AuditFilters {
  actor?: string;
  action?: string;
  table?: string;
  clientId?: string;
  from?: string; // yyyy-MM-dd
  to?: string;
  limit: number;
}

export function useAuditEvents(f: AuditFilters) {
  return useQuery({
    queryKey: ["audit-events", f],
    queryFn: async () => {
      let q = db.from("audit_events").select("*").order("at", { ascending: false }).limit(f.limit);
      if (f.actor) q = f.actor === "system" ? q.is("actor", null) : q.eq("actor", f.actor);
      if (f.action) q = q.eq("action", f.action);
      if (f.table) q = q.eq("table_name", f.table);
      if (f.clientId) q = q.eq("client_id", f.clientId);
      if (f.from) q = q.gte("at", `${f.from}T00:00:00`);
      if (f.to) q = q.lte("at", `${f.to}T23:59:59`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AuditEvent[];
    },
  });
}

/** Nombres de clientes para mostrar en el registro (los borrados no aparecen). */
export function useClientNames(ids: string[]) {
  return useQuery({
    queryKey: ["client-names", ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await db.from("clients").select("id, name").in("id", ids);
      if (error) throw error;
      return Object.fromEntries(((data ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name]));
    },
  });
}

/** Anota una consulta o descarga hecha desde el panel (no bloquea si falla). */
export async function logAccess(path: string, action: "view" | "download") {
  try {
    await db.rpc("log_access", { p_path: path, p_action: action });
  } catch {
    /* la constancia no bloquea la consulta */
  }
}

// ── Revisión anual ───────────────────────────────────────────────────────────

export interface RetentionCandidate {
  client_id: string;
  client_name: string;
  last_activity: string;
  consents: number;
  hold_until: string | null;
  hold_reason: string | null;
}
export interface AccessReviewRow {
  client_id: string;
  client_name: string;
  artist_id: string;
  artist_name: string;
  last_session: string;
}
export interface ReviewStatus {
  web_purge_last_ok: string | null;
  web_purge_last_fail: string | null;
  audit_purge_last_ok: string | null;
  oldest_web_booking: string | null;
  withdrawals_12m: { client_id: string; client_name: string | null; permission: string; withdrawn_at: string; note: string | null }[];
}
export interface AnnualReview {
  id: string;
  review_year: number;
  completed_at: string;
  completed_by: string;
  checklist: Record<string, unknown>;
  notes: string | null;
}

export const useRetentionCandidates = () =>
  useQuery({ queryKey: ["retention-candidates"], queryFn: () => rpcOrThrow<RetentionCandidate[]>("retention_candidates") });

export const useAccessReview = () =>
  useQuery({ queryKey: ["access-review"], queryFn: () => rpcOrThrow<AccessReviewRow[]>("access_review") });

export const useReviewStatus = () =>
  useQuery({ queryKey: ["review-status"], queryFn: () => rpcOrThrow<ReviewStatus>("review_status") });

export function useAnnualReviews(enabled = true) {
  return useQuery({
    queryKey: ["annual-reviews"],
    enabled,
    queryFn: async () => {
      const { data, error } = await db.from("annual_reviews").select("*").order("completed_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AnnualReview[];
    },
  });
}

export function useCompleteAnnualReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: { review_year: number; checklist: Record<string, unknown>; notes: string; completed_by: string }) => {
      const { error } = await db.from("annual_reviews").insert({ ...r, notes: r.notes.trim() || null });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["annual-reviews"] }),
  });
}

export function useSetRetentionHold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, until, reason }: { clientId: string; until: string | null; reason: string | null }) => {
      const { error } = await db
        .from("clients")
        .update({ retention_hold_until: until, retention_hold_reason: reason })
        .eq("id", clientId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["retention-candidates"] }),
  });
}

export function useRevokeAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, artistId }: { clientId: string; artistId: string }) => {
      const { error } = await db
        .from("client_access_revocations")
        .upsert({ client_id: clientId, artist_id: artistId, revoked_at: new Date().toISOString() }, { onConflict: "client_id,artist_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["access-review"] }),
  });
}

/**
 * Borrado de un cliente caducado (revisión anual):
 * 1) la base de datos comprueba y aprueba (1 hora de validez);
 * 2) se borran sus archivos (consentimientos y fotos);
 * 3) se borra la ficha completa y queda constancia sin datos personales.
 */
export function usePurgeExpiredClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, reason }: { clientId: string; reason: string }) => {
      await rpcOrThrow("approve_client_purge", { p_client: clientId });
      for (const [bucket, folder] of [["consent-documents", clientId], ["client-photos", `clients/${clientId}`]] as const) {
        const { data: files, error } = await supabase.storage.from(bucket).list(folder, { limit: 1000 });
        if (error) throw error;
        const paths = (files ?? []).filter((f) => f.id).map((f) => `${folder}/${f.name}`);
        if (paths.length > 0) {
          const { error: rmErr } = await supabase.storage.from(bucket).remove(paths);
          if (rmErr) throw rmErr;
        }
      }
      await rpcOrThrow("purge_expired_client", { p_client: clientId, p_reason: reason });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["retention-candidates"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

/** ¿Toca la revisión anual? A partir de enero de 2027, si no hay revisión del año en curso. */
export function useAnnualReviewDue(isOwner: boolean) {
  const { data } = useAnnualReviews(isOwner);
  const year = new Date().getFullYear();
  if (!isOwner || !data || year < 2027) return false;
  return !data.some((r) => r.review_year === year);
}

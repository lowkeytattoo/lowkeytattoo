import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@shared/lib/supabase";

// Datos legales del aplicador (DNI/NIE y nº de certificado higiénico-sanitario)
// que deben figurar en cada consentimiento. Tabla `artist_legal_info` con RLS:
// cada artista ve/edita lo suyo; los dueños, lo de todos. Nunca en
// shared/config/artists.ts, que se publica con la web.

export interface ArtistLegalInfo {
  profile_id: string;
  nif: string | null;
  sanitary_cert: string | null;
  updated_at: string;
}

// La tabla no está en el tipo Database generado: cliente sin tipar solo para ella.
const db = supabase as unknown as SupabaseClient;

export function useArtistLegalInfo(profileId: string | null | undefined) {
  return useQuery({
    queryKey: ["artist-legal-info", profileId],
    queryFn: async () => {
      const { data, error } = await db
        .from("artist_legal_info")
        .select("profile_id, nif, sanitary_cert, updated_at")
        .eq("profile_id", profileId!)
        .maybeSingle();
      if (error) throw error;
      return (data as ArtistLegalInfo | null) ?? null;
    },
    enabled: !!profileId,
  });
}

/** Datos legales del aplicador a partir de su id de artista (pablo, sergio…). */
export function useApplicatorLegalInfo(artistConfigId: string | null | undefined) {
  return useQuery({
    queryKey: ["applicator-legal-info", artistConfigId],
    queryFn: async () => {
      const { data: prof, error: pErr } = await db
        .from("profiles")
        .select("id")
        .eq("artist_config_id", artistConfigId!)
        .maybeSingle();
      if (pErr) throw pErr;
      if (!prof) return null;
      const { data, error } = await db
        .from("artist_legal_info")
        .select("profile_id, nif, sanitary_cert, updated_at")
        .eq("profile_id", (prof as { id: string }).id)
        .maybeSingle();
      if (error) throw error;
      return (data as ArtistLegalInfo | null) ?? null;
    },
    enabled: !!artistConfigId,
  });
}

export function useSaveArtistLegalInfo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ profileId, nif, sanitaryCert }: { profileId: string; nif: string; sanitaryCert: string }) => {
      const { error } = await db
        .from("artist_legal_info")
        .upsert(
          { profile_id: profileId, nif: nif.trim().toUpperCase() || null, sanitary_cert: sanitaryCert.trim() || null },
          { onConflict: "profile_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["artist-legal-info"] });
      qc.invalidateQueries({ queryKey: ["applicator-legal-info"] });
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@shared/lib/supabase";
import { ARTISTS, Artist } from "@shared/config/artists";
import type { ServiceType } from "@shared/types/index";

/**
 * Fetches the available_services override per artist from the profiles table.
 * Falls back to the static artists.ts config when the column is null or the
 * query fails (e.g. public RLS policy not yet enabled).
 */
export const useArtistsWithServices = (): Artist[] => {
  const { data: servicesMap } = useQuery({
    queryKey: ["artist-services-map"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("artist_config_id, available_services")
        .not("artist_config_id", "is", null);

      if (error) return {} as Record<string, ServiceType[]>;

      const map: Record<string, ServiceType[]> = {};
      (data ?? []).forEach((p) => {
        if (p.artist_config_id && p.available_services) {
          map[p.artist_config_id] = p.available_services as ServiceType[];
        }
      });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!servicesMap) return ARTISTS;

  return ARTISTS.map((artist) => ({
    ...artist,
    services: servicesMap[artist.id] ?? artist.services,
  }));
};

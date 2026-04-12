import { useQuery } from "@tanstack/react-query";
import { supabase } from "@shared/lib/supabase";
import { ARTISTS, Artist } from "@shared/config/artists";
import type { ServiceType } from "@shared/types/index";

/**
 * Fetches the available_services and calendar_id overrides per artist from
 * the profiles table. Falls back to the static artists.ts config when the
 * columns are null or the query fails (e.g. public RLS policy not yet enabled).
 */
export const useArtistsWithServices = (): Artist[] => {
  const { data: overrideMap } = useQuery({
    queryKey: ["artist-overrides-map"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("artist_config_id, available_services, calendar_id")
        .not("artist_config_id", "is", null);

      if (error) return {} as Record<string, { services?: ServiceType[]; calendarId?: string }>;

      const map: Record<string, { services?: ServiceType[]; calendarId?: string }> = {};
      (data ?? []).forEach((p) => {
        if (p.artist_config_id) {
          map[p.artist_config_id] = {
            ...(p.available_services ? { services: p.available_services as ServiceType[] } : {}),
            ...(p.calendar_id ? { calendarId: p.calendar_id } : {}),
          };
        }
      });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!overrideMap) return ARTISTS;

  return ARTISTS.map((artist) => {
    const override = overrideMap[artist.id];
    if (!override) return artist;
    return {
      ...artist,
      ...(override.services ? { services: override.services } : {}),
      ...(override.calendarId ? { calendarId: override.calendarId } : {}),
    };
  });
};

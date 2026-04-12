import { useQuery } from "@tanstack/react-query";
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns";

export interface BusyDays {
  blockedDays: Set<string>; // YYYY-MM-DD — fully blocked (all-day events or ≥7h)
  partialDays: Set<string>; // YYYY-MM-DD — has appointments but still has slots
}

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

async function fetchBusyDays(calendarId: string, timeMin: string, timeMax: string): Promise<BusyDays> {
  const params = new URLSearchParams({ action: "busy-days", calendarId, timeMin, timeMax });
  const res = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar?${params}`, {
    headers: {
      "Authorization": `Bearer ${SUPABASE_ANON}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`busy-days error ${res.status}`);
  const data = await res.json() as { blockedDays: string[]; partialDays: string[] };
  return {
    blockedDays: new Set(data.blockedDays ?? []),
    partialDays:  new Set(data.partialDays  ?? []),
  };
}

/**
 * Fetches busy/partial days for an artist's calendar for the current and next month.
 * Returns empty sets if the artist has no calendarId (graceful degradation).
 */
export function useArtistBusyDays(calendarId: string | null | undefined): BusyDays & { isLoading: boolean } {
  const now = new Date();
  const timeMin = format(startOfMonth(now), "yyyy-MM-dd") + "T00:00:00Z";
  const timeMax = format(endOfMonth(addMonths(now, 2)), "yyyy-MM-dd") + "T23:59:59Z";

  const { data, isLoading } = useQuery({
    queryKey: ["busy-days", calendarId, timeMin, timeMax],
    queryFn: () => fetchBusyDays(calendarId!, timeMin, timeMax),
    enabled: !!calendarId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    blockedDays: data?.blockedDays ?? new Set(),
    partialDays:  data?.partialDays  ?? new Set(),
    isLoading: !!calendarId && isLoading,
  };
}

export function useDayStatus(
  calendarId: string | null | undefined,
  date: Date | null,
): "blocked" | "partial" | "free" | "unknown" {
  const { blockedDays, partialDays, isLoading } = useArtistBusyDays(calendarId);
  if (!date) return "unknown";
  if (isLoading) return "unknown";
  const key = format(date, "yyyy-MM-dd");
  if (blockedDays.has(key)) return "blocked";
  if (partialDays.has(key)) return "partial";
  return "free";
}

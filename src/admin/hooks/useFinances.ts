import { useQuery } from "@tanstack/react-query";
import { supabase } from "@shared/lib/supabase";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

const toNum = (v: unknown): number => parseFloat(String(v ?? 0)) || 0;

export const useFinancesOverview = (artistId?: string) => {
  return useQuery({
    queryKey: ["finances-overview", artistId],
    queryFn: async () => {
      const now = new Date();
      const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

      // Sesiones del mes actual (filtradas en BD, no en cliente)
      let monthQuery = supabase
        .from("sessions")
        .select("price, date, artist_id")
        .gte("date", monthStart)
        .lte("date", monthEnd);
      if (artistId) monthQuery = monthQuery.eq("artist_id", artistId);
      const { data: monthData, error: monthError } = await monthQuery;
      if (monthError) throw monthError;

      // Sesiones impagadas (todo el historial)
      let pendingQuery = supabase
        .from("sessions")
        .select("price")
        .eq("paid", false);
      if (artistId) pendingQuery = pendingQuery.eq("artist_id", artistId);
      const { data: pendingData, error: pendingError } = await pendingQuery;
      if (pendingError) throw pendingError;

      const { count: totalClients } = await supabase
        .from("clients")
        .select("id", { count: "exact", head: true });

      const revenueMonth = (monthData ?? []).reduce((sum, s) => sum + toNum(s.price), 0);
      const sessionsMonth = (monthData ?? []).length;
      const pendingAmount = (pendingData ?? []).reduce((sum, s) => sum + toNum(s.price), 0);

      return {
        revenueMonth,
        sessionsMonth,
        totalClients: totalClients ?? 0,
        pendingAmount,
      };
    },
  });
};

export const useRevenueByMonth = (months = 6, artistId?: string) => {
  return useQuery({
    queryKey: ["revenue-by-month", months, artistId],
    queryFn: async () => {
      const now = new Date();
      const from = format(subMonths(startOfMonth(now), months - 1), "yyyy-MM-dd");

      let query = supabase
        .from("sessions")
        .select("price, date, artist_id, artist:profiles(id, display_name)")
        .gte("date", from)
        .order("date");

      if (artistId) query = query.eq("artist_id", artistId);

      const { data, error } = await query;
      if (error) throw error;

      // Pre-build all month labels in order
      const monthLabels: string[] = [];
      for (let i = months - 1; i >= 0; i--) {
        monthLabels.push(format(subMonths(now, i), "MMM yyyy"));
      }

      const buckets: Record<string, Record<string, number>> = {};
      monthLabels.forEach((label) => { buckets[label] = {}; });

      (data ?? []).forEach((s) => {
        const label = format(new Date(s.date + "T00:00:00"), "MMM yyyy");
        const artistName = (s.artist as any)?.display_name ?? "Sin artista";
        if (!buckets[label]) return;
        buckets[label][artistName] = (buckets[label][artistName] ?? 0) + toNum(s.price);
      });

      // Collect ALL artist names that appear in ANY month
      const allArtistNames = [
        ...new Set(
          Object.values(buckets).flatMap((month) => Object.keys(month))
        ),
      ];

      const rows = monthLabels.map((month) => {
        const entry: Record<string, unknown> = { month };
        // Ensure every artist has a value in every month (0 if no sessions)
        allArtistNames.forEach((name) => {
          entry[name] = buckets[month][name] ?? 0;
        });
        return entry;
      });

      return { rows, artistNames: allArtistNames };
    },
  });
};

export const useUnpaidSessions = (artistId?: string) => {
  return useQuery({
    queryKey: ["unpaid-sessions", artistId],
    queryFn: async () => {
      let query = supabase
        .from("sessions")
        .select("*, client:clients(name), artist:profiles(display_name)")
        .eq("paid", false)
        .order("date", { ascending: false });

      if (artistId) query = query.eq("artist_id", artistId);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@shared/lib/supabase";

export const MessagesUnreadBadge = () => {
  const { data: count } = useQuery({
    queryKey: ["messages-unread-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("web_bookings")
        .select("*", { count: "exact", head: true })
        .is("preferred_date", null)
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });

  if (!count) return null;

  return (
    <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-mono leading-none">
      {count > 9 ? "9+" : count}
    </span>
  );
};

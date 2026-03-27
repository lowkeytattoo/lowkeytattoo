import { useLowStockCount } from "@admin/hooks/useStock";

export const StockAlertBadge = () => {
  const { data: count } = useLowStockCount();

  if (!count) return null;

  return (
    <span className="ml-auto text-xs bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 font-['IBM_Plex_Mono'] min-w-[1.25rem] text-center">
      {count > 99 ? "99+" : count}
    </span>
  );
};

import { useAdminAuth } from "@admin/contexts/AdminAuthContext";
import { usePendingAnnulments } from "@admin/hooks/useConsentForms";

/** Anulaciones de consentimiento pendientes de aprobar (solo dueños). */
export const AnnulmentsPendingBadge = () => {
  const { profile } = useAdminAuth();
  const isOwner = profile?.role === "owner";
  const { data } = usePendingAnnulments(isOwner);
  const count = isOwner ? (data ?? []).length : 0;

  if (!count) return null;

  return (
    <span
      title="Anulaciones de consentimiento pendientes"
      className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-mono leading-none"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
};

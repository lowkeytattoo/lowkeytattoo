import { Link } from "react-router-dom";
import { CalendarCheck } from "lucide-react";
import { useAdminAuth } from "@admin/contexts/AdminAuthContext";
import { useAnnualReviewDue } from "@admin/hooks/useCompliance";

/** Aviso a los dueños: toca la revisión anual de protección de datos (desde enero). */
export const AnnualReviewBanner = () => {
  const { profile } = useAdminAuth();
  const due = useAnnualReviewDue(profile?.role === "owner");
  if (!due) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
      <span className="flex items-center gap-2">
        <CalendarCheck className="w-4 h-4" />
        Toca la revisión anual de protección de datos de {new Date().getFullYear()}.
      </span>
      <Link to="/admin/rgpd/revision" className="underline font-medium">Hacer la revisión</Link>
    </div>
  );
};

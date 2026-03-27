import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "@admin/contexts/AdminAuthContext";

interface Props {
  children: ReactNode;
  requiredRole: "owner";
}

export const RoleGuard = ({ children, requiredRole }: Props) => {
  const { profile, loading } = useAdminAuth();

  if (loading) return null;

  if (!profile || profile.role !== requiredRole) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

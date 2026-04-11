import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "@admin/contexts/AdminAuthContext";

interface Props {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: Props) => {
  const { user, profile, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

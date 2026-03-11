import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "b2b_partner";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { hasRole, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground font-sans">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (requiredRole && !hasRole(requiredRole) && !hasRole("admin")) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;

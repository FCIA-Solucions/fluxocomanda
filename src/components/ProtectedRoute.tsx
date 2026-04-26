import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useProfile } from "@/hooks/useProfile";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Se true, somente role='admin' pode acessar; garçom é redirecionado para /comandas. */
  adminOnly?: boolean;
}

export const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { isBlocked, loading: subLoading } = useSubscription();
  const { role, loading: profileLoading } = useProfile();

  if (loading || (user && (subLoading || profileLoading))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isBlocked) {
    return <Navigate to="/assinatura" replace />;
  }

  if (adminOnly && role !== "admin" && role !== "superadmin") {
    return <Navigate to="/comandas" replace />;
  }

  return <>{children}</>;
};

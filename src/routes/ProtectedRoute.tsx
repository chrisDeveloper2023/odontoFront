import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: string | string[];
  fallback?: ReactNode;
}

const NoAccessPage = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="rounded-lg border border-dashed p-6 text-center">
      <h2 className="text-lg font-semibold">Acceso denegado</h2>
      <p className="text-sm text-muted-foreground">No tienes permisos para acceder a esta seccion.</p>
    </div>
  </div>
);

export default function ProtectedRoute({ children, requiredPermissions, fallback }: ProtectedRouteProps) {
  const { session, hasPermission } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermissions && !hasPermission(requiredPermissions)) {
    if (fallback) return <>{fallback}</>;
    return <NoAccessPage />;
  }

  return <>{children}</>;
}

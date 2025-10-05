import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface PermissionRouteProps {
  children: React.ReactNode;
  permissions: string | string[];
  fallbackPath?: string;
  showAccessDenied?: boolean;
}

const PermissionRoute: React.FC<PermissionRouteProps> = ({
  children,
  permissions,
  fallbackPath = "/",
  showAccessDenied = false
}) => {
  const { session, hasPermission } = useAuth();

  // Verificar autenticación
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Verificar permisos
  if (!hasPermission(permissions)) {
    if (showAccessDenied) {
      return (
        <div className="container mx-auto p-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Acceso Denegado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No tienes permisos suficientes para acceder a esta sección.
              </p>
              <div className="mt-4">
                <Navigate to={fallbackPath} replace />
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default PermissionRoute;

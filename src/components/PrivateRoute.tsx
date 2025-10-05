import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface PrivateRouteProps {
  children: React.ReactNode;
  permissions?: string | string[];
  fallbackPath?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  permissions,
  fallbackPath = "/"
}) => {
  const { session, hasPermission } = useAuth();

  // Verificar autenticación
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Verificar permisos si se especifican
  if (permissions && !hasPermission(permissions)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;

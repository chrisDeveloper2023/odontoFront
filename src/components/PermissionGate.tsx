import React from "react";
import { useAuth } from "@/context/AuthContext";

interface PermissionGateProps {
  children: React.ReactNode;
  permissions: string | string[];
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

/**
 * Componente que renderiza contenido solo si el usuario tiene los permisos necesarios
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permissions,
  fallback = null,
  requireAll = false
}) => {
  const { hasPermission } = useAuth();

  const hasRequiredPermissions = requireAll
    ? Array.isArray(permissions)
      ? permissions.every(perm => hasPermission(perm))
      : hasPermission(permissions)
    : Array.isArray(permissions)
    ? permissions.some(perm => hasPermission(perm))
    : hasPermission(permissions);

  return hasRequiredPermissions ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGate;

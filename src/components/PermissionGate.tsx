import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

interface PermissionGateProps {
  permissions: string | string[];
  children: ReactNode;
}

export function PermissionGate({ permissions, children }: PermissionGateProps) {
  const { hasPermission } = useAuth();
  return hasPermission(permissions) ? <>{children}</> : null;
}

export default PermissionGate;

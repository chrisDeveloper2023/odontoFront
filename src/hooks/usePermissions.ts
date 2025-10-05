import { useAuth } from "@/context/AuthContext";
import { useMemo } from "react";

/**
 * Hook personalizado para manejar permisos de manera más fácil
 */
export const usePermissions = () => {
  const { session, hasPermission } = useAuth();

  const permissions = useMemo(() => {
    return session?.usuario?.permissions || session?.usuario?.rol?.permissions || [];
  }, [session]);

  const can = useMemo(() => {
    return (code: string | string[]): boolean => {
      return hasPermission(code);
    };
  }, [hasPermission]);

  const canAny = useMemo(() => {
    return (codes: string[]): boolean => {
      return codes.some(code => hasPermission(code));
    };
  }, [hasPermission]);

  const canAll = useMemo(() => {
    return (codes: string[]): boolean => {
      return codes.every(code => hasPermission(code));
    };
  }, [hasPermission]);

  const isAdmin = useMemo(() => {
    return hasPermission('admin:access') || permissions.includes('admin:access');
  }, [hasPermission, permissions]);

  const isDoctor = useMemo(() => {
    return hasPermission('doctor:access') || permissions.includes('doctor:access');
  }, [hasPermission, permissions]);

  const isRecepcionista = useMemo(() => {
    return hasPermission('recepcionista:access') || permissions.includes('recepcionista:access');
  }, [hasPermission, permissions]);

  return {
    permissions,
    hasPermission: can,
    canAny,
    canAll,
    isAdmin,
    isDoctor,
    isRecepcionista,
  };
};

export default usePermissions;

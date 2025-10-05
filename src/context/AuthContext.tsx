import { createContext, useContext, useMemo } from "react";
import type { StoredAuth } from "@/lib/auth";

export interface AuthState {
  token: string | null;
  user: any | null;
  permissions: string[];
}

export interface AuthContextValue {
  session: StoredAuth | null;
  setSession: (session: StoredAuth | null) => void;
  logout: () => void;
  hasPermission: (code: string | string[]) => boolean;
  permissions: string[];
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = AuthContext.Provider;

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}

export function useIsAuthenticated(session: StoredAuth | null) {
  return useMemo(() => {
    if (!session) return false;
    if (!session.expiresAt) return true;
    return session.expiresAt > Date.now();
  }, [session]);
}

export function usePermissions() {
  const { permissions } = useAuth();
  return permissions;
}

export function useHasPermission() {
  const { hasPermission } = useAuth();
  return hasPermission;
}
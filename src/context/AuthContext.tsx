import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { StoredAuth } from "@/lib/auth";
import { clearAuth, loadStoredAuth, persistAuth } from "@/lib/auth";
import { addUnauthorizedHandler } from "@/lib/auth-events";
import { refreshToken } from "@/lib/api/refreshToken";

export interface AuthContextValue {
  session: StoredAuth | null;
  setSession: (session: StoredAuth | null) => void;
  logout: () => void;
  hasPermission: (code: string | string[]) => boolean;
  permissions: string[];
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<StoredAuth | null>(() => loadStoredAuth());

  const permissions = useMemo(() => {
    const direct = session?.usuario?.permissions ?? [];
    if (direct.length > 0) return direct;
    const rolePerms = session?.usuario?.rol?.permissions;
    return Array.isArray(rolePerms) ? rolePerms : [];
  }, [session]);

  const setSession = useCallback((next: StoredAuth | null) => {
    setSessionState(next);
    if (!next) {
      clearAuth();
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setSessionState(null);
  }, []);

  const hasPermission = useCallback(
    (code: string | string[]) => {
      const required = Array.isArray(code) ? code : [code];
      if (!required.length) return true;
      const available = new Set(permissions);
      return required.some((perm) => available.has(perm));
    },
    [permissions]
  );

  useEffect(() => {
    const removeHandler = addUnauthorizedHandler(() => {
      logout();
    });
    return removeHandler;
  }, [logout]);

  useEffect(() => {
    if (!session?.token) return;

    const intervalId = window.setInterval(async () => {
      try {
        const token = await refreshToken();
        setSessionState((prev) => {
          if (!prev) return prev;
          const ttl = prev.expiresAt ? Math.max(300, Math.round((prev.expiresAt - Date.now()) / 1000)) : 3600;
          return persistAuth({ token, expiresIn: ttl, usuario: prev.usuario });
        });
      } catch (error) {
        console.error("Token refresh failed:", error);
        logout();
      }
    }, 55 * 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [session?.token, logout]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    setSession,
    logout,
    hasPermission,
    permissions,
  }), [session, setSession, logout, hasPermission, permissions]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

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

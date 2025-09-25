import { setAuthToken } from "@/api/client";
import { setTenantSlug, clearTenant } from "@/lib/tenant";

const AUTH_USER_KEY = "authUser";

export interface AuthSession {
  token: string;
  expiresIn: number;
  usuario: {
    id: number;
    correo: string;
    nombres: string;
    apellidos: string;
    roles: string[];
    tenantId?: number;
    tenantSlug?: string;
  };
}

export interface StoredAuth {
  token: string;
  usuario: AuthSession["usuario"];
  expiresAt?: number;
}

export function loadStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function clearAuth() {
  setAuthToken(null);
  try {
    localStorage.removeItem(AUTH_USER_KEY);
  } catch {}
  clearTenant();
}

export function persistAuth(session: AuthSession): StoredAuth {
  setAuthToken(session.token);
  if (session.usuario.tenantSlug) {
    setTenantSlug(session.usuario.tenantSlug);
  }
  const expiresAt = session.expiresIn ? Date.now() + session.expiresIn * 1000 : undefined;
  const stored: StoredAuth = {
    token: session.token,
    usuario: session.usuario,
    expiresAt,
  };
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(stored));
  } catch {}
  return stored;
}
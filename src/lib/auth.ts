import { setAuthToken, setTenant } from "@/api/client";
import { clearTenant, setTenantSlug } from "@/lib/tenant";
import type { Usuario } from "@/types/usuario";

const AUTH_USER_KEY = "authUser";

export interface AuthSession {
  token: string;
  expiresIn: number;
  usuario: Usuario;
}

export interface StoredAuth {
  token: string;
  usuario: Usuario;
  expiresAt?: number;
}

const resolveTenantSlug = (usuario: Usuario | null | undefined) => {
  if (!usuario) return null;
  return usuario.tenantSlug ?? usuario.tenant?.slug ?? null;
};

const resolveTenantId = (usuario: Usuario | null | undefined) => {
  if (!usuario) return null;
  return usuario.tenant_id ?? usuario.tenant?.id ?? null;
};

export function loadStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    return parsed;
  } catch {
    return null;
  }
}

export function clearAuth() {
  setAuthToken(null);
  try {
    localStorage.removeItem(AUTH_USER_KEY);
  } catch {
    /* noop */
  }
  clearTenant();
}

export function persistAuth(session: AuthSession): StoredAuth {
  setAuthToken(session.token);

  const tenantSlug = resolveTenantSlug(session.usuario);
  if (tenantSlug) {
    setTenantSlug(tenantSlug);
  }

  const tenantId = resolveTenantId(session.usuario);
  if (tenantId !== null && tenantId !== undefined) {
    setTenant(String(tenantId));
  }

  const expiresAt = session.expiresIn ? Date.now() + session.expiresIn * 1000 : undefined;
  const stored: StoredAuth = {
    token: session.token,
    usuario: session.usuario,
    expiresAt,
  };

  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(stored));
  } catch {
    /* noop */
  }

  return stored;
}

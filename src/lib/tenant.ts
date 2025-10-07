import { setTenant as setTenantHeader, clearTenant as clearTenantHeader } from "@/api/client";

const SLUG_KEY = "tenantSlug";
const ID_KEY = "tenantId";

const safeGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* noop */
  }
};

const safeRemove = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* noop */
  }
};

export function getTenantSlug(): string | null {
  return safeGet(SLUG_KEY);
}

export function getTenantId(): string | null {
  return safeGet(ID_KEY);
}

export function setTenantSlug(slug: string) {
  safeSet(SLUG_KEY, slug);
}

export function setTenantId(id: string | number) {
  const value = String(id);
  safeSet(ID_KEY, value);
  setTenantHeader(value);
}

export function getTenantHeaders(): Record<string, string> {
  const tenantId = getTenantId();
  return tenantId ? { "X-Tenant-ID": tenantId } : {};
}

export function clearTenant() {
  clearTenantHeader();
  safeRemove(SLUG_KEY);
  safeRemove(ID_KEY);
}

let patched = false;
export function initTenant() {
  const tenantId = getTenantId();
  if (tenantId) {
    setTenantHeader(tenantId);
  }

  if (typeof window !== "undefined" && !patched) {
    patched = true;
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const nextHeaders: Record<string, string> = {
        ...(init?.headers as Record<string, string> | undefined ?? {}),
        ...getTenantHeaders(),
      };
      const nextInit: RequestInit = { ...(init || {}), headers: nextHeaders };
      return originalFetch(input, nextInit);
    };
  }
}

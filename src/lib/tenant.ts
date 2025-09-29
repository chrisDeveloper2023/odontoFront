// src/lib/tenant.ts
import { setTenant as setAxiosTenant, clearTenant as clearAxiosTenant } from "@/api/client";

const KEY = "tenantSlug";

export function getTenantSlug(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export function setTenantSlug(slug: string) {
  try { localStorage.setItem(KEY, slug); } catch {}
  setAxiosTenant(slug);
}

export function getTenantHeaders(): Record<string, string> {
  const slug = getTenantSlug() || (import.meta.env.DEV ? "default" : "");
  return slug ? { "X-Tenant": slug } : {};
}

export function clearTenant() {
  try { localStorage.removeItem(KEY); } catch {}
  clearAxiosTenant();
}

// Parche global para fetch: anade X-Tenant automaticamente
let patched = false;
export function initTenant() {
  const stored = getTenantSlug();
  if (!stored && import.meta.env.DEV) {
    // Config default para desarrollo
    setTenantSlug("default");
  } else if (stored) {
    setAxiosTenant(stored);
  }

  if (typeof window !== "undefined" && !patched) {
    patched = true;
    const origFetch = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const hdrs: Record<string, string> = {
        ...(init?.headers as any || {}),
        ...getTenantHeaders(),
      };
      const next: RequestInit = { ...(init || {}), headers: hdrs };
      return origFetch(input, next);
    };
  }
}

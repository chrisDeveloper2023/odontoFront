import api from "@/lib/api/axiosInstance";
import { toast } from "sonner";
import { notifyUnauthorized } from "@/lib/auth-events";

const TOKEN_KEY = "token";
const TENANT_ID_KEY = "tenantId";
const TENANT_SLUG_KEY = "tenantSlug";

export { api };

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

const bootstrap = () => {
  const token = safeGet(TOKEN_KEY);
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }

  const tenantId = safeGet(TENANT_ID_KEY);
  if (tenantId) {
    api.defaults.headers.common["X-Tenant-ID"] = tenantId;
  }
};

bootstrap();

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    safeSet(TOKEN_KEY, token);
  } else {
    delete api.defaults.headers.common.Authorization;
    safeRemove(TOKEN_KEY);
  }
};

export const setTenant = (tenantId: string | number | null | undefined) => {
  if (tenantId === null || tenantId === undefined || tenantId === "") {
    clearTenant();
    return;
  }
  const value = String(tenantId);
  api.defaults.headers.common["X-Tenant-ID"] = value;
  safeSet(TENANT_ID_KEY, value);
};

export const clearTenant = () => {
  delete api.defaults.headers.common["X-Tenant-ID"];
  safeRemove(TENANT_ID_KEY);
};

export const setTenantSlug = (slug: string | null) => {
  if (!slug) return;
  safeSet(TENANT_SLUG_KEY, slug);
};

export const clearTenantSlug = () => {
  safeRemove(TENANT_SLUG_KEY);
};

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const response = err?.response;
    const data = response?.data ?? {};
    const status = response?.status;
    const msg = data?.mensaje || data?.error || err.message || "Error de red";

    if (status === 400 && String(data?.mensaje ?? "").toLowerCase().includes("tenant")) {
      toast.error("Tenant requerido. Selecciona una clinica.");
    }

    if (status === 401) {
      notifyUnauthorized();
      toast.error("Sesion expirada o credenciales invalidas");
    }

    if (status === 403) {
      toast.error(msg || "Acceso denegado (403)");
    }

    console.error(`API ${status ?? "?"} ${err.config?.method?.toUpperCase?.() ?? ""} ${err.config?.url}`, data);
    const clientError = new Error(msg) as Error & { status?: number; payload?: any };
    clientError.status = status;
    clientError.payload = data;
    return Promise.reject(clientError);
  }
);

export const apiGet = async <T = any>(url: string, params?: any): Promise<T> => {
  const res = await api.get<T>(url, { params });
  return res.data as T;
};

export const apiPost = async <T = any>(url: string, body?: any): Promise<T> => {
  const res = await api.post<T>(url, body);
  return res.data as T;
};

export const apiPut = async <T = any>(url: string, body?: any): Promise<T> => {
  const res = await api.put<T>(url, body);
  return res.data as T;
};

export const apiPatch = async <T = any>(url: string, body?: any): Promise<T> => {
  const res = await api.patch<T>(url, body);
  return res.data as T;
};

export const apiDelete = async <T = any>(url: string): Promise<T> => {
  const res = await api.delete<T>(url);
  return res.data as T;
};

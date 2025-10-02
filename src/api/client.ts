import axios from "axios";
import { toast } from "sonner";
import { notifyUnauthorized } from "@/lib/auth-events";

const baseURL = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");
const AUTH_KEY = "authToken";
const TENANT_KEY = "tenantSlug";

export const api = axios.create({ baseURL });

const storedToken = (() => {
  try {
    return localStorage.getItem(AUTH_KEY) || null;
  } catch {
    return null;
  }
})();

if (storedToken) {
  api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
}

const storedTenant = (() => {
  try {
    return localStorage.getItem(TENANT_KEY) || null;
  } catch {
    return null;
  }
})();

if (storedTenant) {
  api.defaults.headers.common["X-Tenant"] = storedTenant;
}

export const setTenant = (slug: string) => {
  if (!slug) return;
  api.defaults.headers.common["X-Tenant"] = slug;
  try {
    localStorage.setItem(TENANT_KEY, slug);
  } catch {}
};

export const clearTenant = () => {
  delete api.defaults.headers.common["X-Tenant"];
  try {
    localStorage.removeItem(TENANT_KEY);
  } catch {}
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    try {
      localStorage.setItem(AUTH_KEY, token);
    } catch {}
  } else {
    delete api.defaults.headers.common.Authorization;
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {}
  }
};

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const response = err?.response;
    const data = response?.data ?? {};
    const status = response?.status;
    const msg = data?.mensaje || data?.error || err.message || "Error de red";

    if (status === 400 && String(data?.mensaje ?? "").toLowerCase().includes("tenant")) {
      if (import.meta.env.DEV) {
        setTenant("default");
        toast.info("Se configuro tenant 'default' para desarrollo.");
      } else {
        toast.error("Tenant requerido. Selecciona una clinica.");
      }
    }

    if (status === 401) {
      setAuthToken(null);
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





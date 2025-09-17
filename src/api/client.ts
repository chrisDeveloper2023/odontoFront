// src/api/client.ts
import axios from "axios";
import { toast } from "sonner";

const baseURL = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");

export const api = axios.create({ baseURL });

// Tenant helpers (header X-Tenant)
export const setTenant = (slug: string) => {
  if (!slug) return;
  api.defaults.headers.common["X-Tenant"] = slug;
  try { localStorage.setItem("tenantSlug", slug); } catch {}
};
export const clearTenant = () => {
  delete api.defaults.headers.common["X-Tenant"];
  try { localStorage.removeItem("tenantSlug"); } catch {}
};

// Interceptor de respuesta: normaliza errores y maneja tenant/403
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const response = err?.response;
    const data = response?.data ?? {};
    const status = response?.status;
    const msg = data?.mensaje || data?.error || err.message || "Error de red";

    if (status === 400 && String(data?.mensaje).toLowerCase().includes("tenant")) {
      // Tenant requerido: en dev autoconfigura 'default' y sugiere refrescar
      if (import.meta.env.DEV) {
        setTenant("default");
        toast.info("Se configuró tenant 'default' para desarrollo.");
      } else {
        toast.error("Tenant requerido. Selecciona una clínica/tenant.");
      }
    }

    if (status === 403) {
      toast.error(msg || "Acceso denegado (403)");
    }

    // Log útil para diagnóstico
    console.error(
      `[API ${status ?? "?"}] ${err.config?.method?.toUpperCase?.() ?? ""} ${err.config?.url}`,
      data
    );
    return Promise.reject(new Error(msg));
  }
);

// Helpers mínimos
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


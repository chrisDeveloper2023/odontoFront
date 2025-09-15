// src/api/client.ts
import axios from "axios";

const baseURL = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");

export const api = axios.create({ baseURL });

// Interceptor de respuesta: normaliza errores y logs
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const response = err?.response;
    const data = response?.data;
    const msg = data?.mensaje || data?.error || err.message || "Error de red";
    // Log útil para diagnóstico
    console.error(`[API ${response?.status ?? "?"}] ${err.config?.method?.toUpperCase?.() ?? ""} ${err.config?.url}`, data);
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


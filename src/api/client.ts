// src/api/client.ts
import axios from "axios";
import { authService } from "@/services/auth";

const baseURL = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");

export const api = axios.create({ baseURL });

// Interceptor de request: añade Bearer token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuesta: normaliza errores y logs
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const response = err?.response;
    const data = response?.data;
    const msg = data?.mensaje || data?.error || err.message || "Error de red";
    
    // Si el token expiró (401), hacer logout automático
    if (response?.status === 401) {
      authService.logout();
      // Redirigir al login si no estamos ya ahí
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
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


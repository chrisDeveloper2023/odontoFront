import axios from "axios";

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, ""),
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = (() => {
    try {
      return localStorage.getItem("token");
    } catch {
      return null;
    }
  })();

  const tenantId = (() => {
    try {
      return localStorage.getItem("tenantId");
    } catch {
      return null;
    }
  })();

  config.headers = config.headers ?? {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  if (tenantId) {
    const value = String(tenantId);
    config.headers["X-Tenant-Id"] = value;
    config.headers["X-Tenant-ID"] = value;
  } else {
    delete config.headers["X-Tenant-Id"];
    delete config.headers["X-Tenant-ID"];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        localStorage.clear();
      } catch {
        /* noop */
      }
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

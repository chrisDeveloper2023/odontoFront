import axios from "axios";

const rawOverride = import.meta.env.VITE_TENANTS_URL?.toString().trim();
const overrideBase = rawOverride ? rawOverride.replace(/\/+$/, "") : "";

const rawApiBase = import.meta.env.VITE_API_URL?.toString().trim() || "";
const sanitizedApiBase = rawApiBase.replace(/\/+$/, "");
const fallbackBase = sanitizedApiBase.endsWith("/api")
  ? sanitizedApiBase.slice(0, -4)
  : sanitizedApiBase;

const resolvedBase = overrideBase || fallbackBase;
const basePath = `${resolvedBase ? resolvedBase : ""}/tenants`
  .replace(/\/{2,}/g, "/")
  .replace(/^(https?:)\/+/, "$1//");

const http = axios.create({ withCredentials: true });

const buildUrl = (suffix = "") => `${basePath}${suffix}`;

export const TenantsApi = {
  list: () => http.get(buildUrl()).then((response) => response.data),
  get: (id: number) => http.get(buildUrl(`/${id}`)).then((response) => response.data),
  create: (payload: any) => http.post(buildUrl(), payload).then((response) => response.data),
  update: (id: number, payload: any) => http.put(buildUrl(`/${id}`), payload).then((response) => response.data),
  remove: (id: number) => http.delete(buildUrl(`/${id}`)).then((response) => response.data),
};


import { apiDelete, apiGet, apiPost, apiPut } from "@/api/client";
import { ensureArray, mapPago } from "@/lib/api/mappers";
import type { Pago, PagoList, PagoPayload } from "@/types/pago";

const toNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const pickMetaNumber = (source: any, keys: string[]): number | undefined => {
  if (!source || typeof source !== "object") return undefined;
  for (const key of keys) {
    if (key.includes('.')) {
      const [first, ...rest] = key.split('.');
      let current: any = (source as any)[first];
      for (const part of rest) {
        if (!current || typeof current !== 'object') {
          current = undefined;
          break;
        }
        current = current[part];
      }
      const parsed = toNumber(current);
      if (parsed !== undefined) return parsed;
      continue;
    }
    const parsed = toNumber((source as any)[key]);
    if (parsed !== undefined) return parsed;
  }
  return undefined;
};

export interface PagosQuery {
  page?: number;
  limit?: number;
  tenant_id?: number;
  clinica_id?: number;
  [key: string]: string | number | undefined;
}

export async function fetchPagos(query?: PagosQuery): Promise<PagoList> {
  const payload = await apiGet<any>("/pagos", query);
  const items = ensureArray(payload).map(mapPago);
  const metaSource = Array.isArray(payload) ? {} : payload ?? {};
  const total = pickMetaNumber(metaSource, ["total", "totalItems", "total_items", "meta.total"]);
  const totalPages = pickMetaNumber(metaSource, ["totalPages", "total_pages", "meta.totalPages"]);

  return {
    items,
    total,
    totalPages,
  };
}

export async function fetchPago(id: number): Promise<Pago | null> {
  const payload = await apiGet<any>(`/pagos/${id}`);
  if (!payload) return null;
  return mapPago(payload);
}

export async function createPago(payload: PagoPayload): Promise<Pago> {
  const response = await apiPost<any>("/pagos", payload);
  return mapPago(response);
}

export async function updatePago(id: number, payload: PagoPayload): Promise<Pago> {
  const response = await apiPut<any>(`/pagos/${id}`, payload);
  return mapPago(response);
}

export async function deletePago(id: number): Promise<void> {
  await apiDelete(`/pagos/${id}`);
}

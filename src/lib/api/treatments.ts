import { apiDelete, apiGet, apiPost, apiPut } from "@/api/client";
import { ensureArray, mapTreatment } from "@/lib/api/mappers";
import type { Treatment, TreatmentPayload } from "@/types/treatment";

const BASE_PATH = "/tratamientos";

const toNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const fetchTreatments = async (): Promise<Treatment[]> => {
  const payload = await apiGet<unknown>(BASE_PATH);
  const items = ensureArray<unknown>(payload);
  return items.map(mapTreatment);
};

export const createTreatment = async (data: TreatmentPayload): Promise<Treatment> => {
  const payload = await apiPost<unknown>(BASE_PATH, serializePayload(data));
  return mapTreatment(payload);
};

export const updateTreatment = async (id: number, data: TreatmentPayload): Promise<Treatment> => {
  const payload = await apiPut<unknown>(`${BASE_PATH}/${id}`, serializePayload(data));
  return mapTreatment(payload);
};

export const deleteTreatment = async (id: number): Promise<void> => {
  await apiDelete(`${BASE_PATH}/${id}`);
};

export interface TreatmentFormValues extends TreatmentPayload {
  id?: number;
}

const serializePayload = (data: TreatmentPayload): Record<string, unknown> => {
  return {
    nombre: data.nombre,
    descripcion: data.descripcion ?? null,
    costo_base: Number(data.costo_base ?? 0),
    id_clinica: toNumber(data.id_clinica) ?? null,
    id_pieza: toNumber(data.id_pieza) ?? null,
    facturado: Boolean(data.facturado),
    pagado: Boolean(data.pagado),
  };
};

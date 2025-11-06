import { apiGet } from "@/api/client";
import { ensureArray, mapHistoriaClinica } from "@/lib/api/mappers";
import type { HistoriaClinica, HistoriaClinicaList } from "@/types/historiaClinica";

const toNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const pickMetaNumber = (source: any, keys: string[]): number | undefined => {
  if (!source || typeof source !== "object") return undefined;

  for (const key of keys) {
    if (key.includes(".")) {
      const [first, ...rest] = key.split(".");
      const nested = (source as any)[first];
      if (nested && typeof nested === "object") {
        const value = rest.reduce((acc: any, part: string) => (acc ? acc[part] : undefined), nested);
        const parsed = toNumber(value);
        if (parsed !== undefined) return parsed;
      }
      continue;
    }

    const parsed = toNumber((source as any)[key]);
    if (parsed !== undefined) return parsed;
  }

  return undefined;
};

export interface HistoriasClinicasQuery {
  page?: number;
  limit?: number;
  [key: string]: string | number | undefined;
}

export async function fetchHistoriasClinicas(query?: HistoriasClinicasQuery): Promise<HistoriaClinicaList> {
  const payload = await apiGet<any>("/historias-clinicas", query);
  const items = ensureArray(payload).map(mapHistoriaClinica);
  const metaSource = Array.isArray(payload) ? {} : payload ?? {};

  const total = pickMetaNumber(metaSource, [
    "total",
    "totalCount",
    "totalItems",
    "total_items",
    "total_registros",
    "meta.total",
  ]);

  const totalPages = pickMetaNumber(metaSource, [
    "totalPages",
    "total_pages",
    "totalPaginas",
    "total_paginas",
    "meta.totalPages",
  ]);

  return {
    items,
    total,
    totalPages,
  };
}

export async function fetchHistoriasPorPaciente(pacienteId: number): Promise<HistoriaClinica[]> {
  if (!pacienteId) return [];
  const payload = await apiGet<any>(`/pacientes/${pacienteId}/historias-clinicas`);
  const source = Array.isArray(payload?.data) ? payload.data : payload;
  return ensureArray(source).map(mapHistoriaClinica);
}

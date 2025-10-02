import { useCallback, useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "@/api/client";
import { ensureArray, mapClinica } from "@/lib/api/mappers";
import type { Clinica } from "@/types/clinica";

export type Clinic = Clinica;

export type ClinicaPayload = {
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  correo?: string | null;
  activo?: boolean;
  tenant_id?: number | null;
};

const buildPayload = (payload: ClinicaPayload) => {
  const body: Record<string, any> = {
    nombre: payload.nombre,
  };
  if (payload.direccion !== undefined) body.direccion = payload.direccion;
  if (payload.telefono !== undefined) body.telefono = payload.telefono;
  if (payload.correo !== undefined) body.correo = payload.correo;
  if (payload.activo !== undefined) body.activo = Boolean(payload.activo);
  if (payload.tenant_id !== undefined) body.tenant_id = payload.tenant_id;
  return body;
};

export async function fetchClinics(): Promise<Clinica[]> {
  const data = await apiGet<unknown>("/clinicas");
  return ensureArray(data).map(mapClinica);
}

export async function fetchClinic(id: number): Promise<Clinica | null> {
  const data = await apiGet<unknown>(`/clinicas/${id}`);
  return data ? mapClinica(data) : null;
}

export async function createClinic(payload: ClinicaPayload): Promise<Clinica> {
  const data = await apiPost<unknown>("/clinicas", buildPayload(payload));
  return mapClinica(data);
}

export async function updateClinic(id: number, payload: ClinicaPayload): Promise<Clinica> {
  const data = await apiPut<unknown>(`/clinicas/${id}`, buildPayload(payload));
  return mapClinica(data);
}

export async function deleteClinic(id: number): Promise<void> {
  await apiDelete(`/clinicas/${id}`);
}

export function useClinicas() {
  const [clinics, setClinics] = useState<Clinica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClinics = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchClinics();
      setClinics(list);
      setError(null);
    } catch (err) {
      console.error("Error fetching clinics", err);
      const message = err instanceof Error ? err.message : "No se pudieron cargar las clinicas";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClinics();
  }, [loadClinics]);

  const activeCount = useMemo(() => clinics.filter((clinic) => clinic.activo).length, [clinics]);

  return {
    clinics,
    loading,
    error,
    refetch: loadClinics,
    total: clinics.length,
    activeCount,
  };
}

export { mapClinica };

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "@/api/client";

interface ClinicDto {
  id_clinica: number;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  activo: boolean;
  tenant_id?: number | null;
}

export interface Clinic {
  id: number;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  activo: boolean;
  tenantId?: number | null;
}

export interface ClinicPayload {
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  correo?: string | null;
  activo?: boolean;
}

const ensureArray = (data: unknown): ClinicDto[] => {
  if (Array.isArray(data)) {
    return data as ClinicDto[];
  }
  if (data && typeof data === "object" && Array.isArray((data as any).data)) {
    return (data as any).data as ClinicDto[];
  }
  return [];
};

const mapClinic = (dto: ClinicDto): Clinic => ({
  id: dto.id_clinica,
  nombre: dto.nombre,
  direccion: dto.direccion ?? null,
  telefono: dto.telefono ?? null,
  correo: dto.correo ?? null,
  activo: Boolean(dto.activo),
  tenantId: dto.tenant_id ?? undefined,
});

export async function fetchClinics(): Promise<Clinic[]> {
  const data = await apiGet<unknown>("/clinicas");
  return ensureArray(data).map(mapClinic);
}

export async function fetchClinic(id: number): Promise<Clinic | null> {
  const dto = await apiGet<ClinicDto | null>(`/clinicas/${id}`);
  return dto ? mapClinic(dto) : null;
}

export async function createClinic(payload: ClinicPayload): Promise<Clinic> {
  const dto = await apiPost<ClinicDto>("/clinicas", payload);
  return mapClinic(dto);
}

export async function updateClinic(id: number, payload: ClinicPayload): Promise<Clinic> {
  const dto = await apiPut<ClinicDto>(`/clinicas/${id}`, payload);
  return mapClinic(dto);
}

export async function deleteClinic(id: number): Promise<void> {
  await apiDelete(`/clinicas/${id}`);
}

export function useClinicas() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
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

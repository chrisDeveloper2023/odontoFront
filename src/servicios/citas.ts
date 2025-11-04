import { apiGet, apiPost } from "@/api/client";

// src/services/citas.ts
export interface DisponibilidadResponse {
  fecha: string;
  duracion_minutos: number;
  desde: string;   // "08:00"
  hasta: string;   // "18:00"
  disponibles: string[]; // ISO strings, p.ej. "2025-09-01T08:00:00.000Z"
}

export async function getDisponibilidad(
  consultorioId: number,
  fecha: string,             // "YYYY-MM-DD"
  duracionMinutos: number    // p.ej. 30
): Promise<DisponibilidadResponse> {
  return apiGet<DisponibilidadResponse>("/citas/disponibilidad", {
    consultorio: String(consultorioId),
    fecha,
    duracion: String(duracionMinutos),
  });
}

export interface ReprogramarCitaPayload {
  fecha_hora: string;
  motivo?: string;
}

export interface CancelarCitaPayload {
  motivo: string;
}

export interface CitaHistorialEntry {
  id?: number | string;
  id_cita?: number;
  estado_anterior?: string | null;
  estado_nuevo?: string | null;
  motivo?: string | null;
  fecha_cambio?: string | null;
  usuario?: string | null | Record<string, unknown>;
  [key: string]: unknown;
}

export const confirmarCita = async (id: number) => {
  return apiPost<void>(`/citas/${id}/confirmar`);
};

export const reprogramarCita = async (id: number, data: ReprogramarCitaPayload) => {
  return apiPost<void>(`/citas/${id}/reprogramar`, data);
};

export const cancelarCita = async (id: number, data: CancelarCitaPayload) => {
  return apiPost<void>(`/citas/${id}/cancelar`, data);
};

export const obtenerHistorialCita = async (id: number) => {
  return apiGet<CitaHistorialEntry[]>("/citas-historial", {
    id_cita: String(id),
  });
};

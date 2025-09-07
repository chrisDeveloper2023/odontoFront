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
  const qs = new URLSearchParams({
    consultorio: String(consultorioId),
    fecha,
    duracion: String(duracionMinutos),
  });
  const res = await fetch(`${import.meta.env.VITE_API_URL}/citas/disponibilidad?${qs.toString()}`);
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(err || "No se pudo obtener disponibilidad");
  }
  return res.json();
}

// src/services/usuarios.ts
export interface Doctor {
  id: number;
  nombres: string;
  apellidos: string;
}

function normalizeUsersPayload(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  return raw?.data || raw?.usuarios || raw?.items || raw?.results || [];
}

export async function getOdontologos(): Promise<Doctor[]> {
  // Ruta preferida que en tu entorno SÍ devuelve datos JSON
  const res = await fetch(`${import.meta.env.VITE_API_URL}/usuarios?rol=ODONTOLOGO`);
  if (!res.ok) throw new Error("No se pudo obtener usuarios por rol ODONTOLOGO");

  const json = await res.json();
  const arr = normalizeUsersPayload(json);

  // Mapeo tolerante a nombres de campos
  const docs: Doctor[] = arr
    .map((u: any) => ({
      id: Number(u.id ?? u.id_usuario ?? u.id_odontologo ?? u.usuario_id),
      nombres: u.nombres ?? u.nombre ?? u.first_name ?? "",
      apellidos: u.apellidos ?? u.apellido ?? u.last_name ?? "",
    }))
    .filter((d: Doctor) => Number.isFinite(d.id) && d.nombres);

  return docs;
}

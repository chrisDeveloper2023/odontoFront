// src/lib/api/odontograma.ts
export type EstadoPieza = "SANO" | "AUSENTE" | string;

export type SuperficieCode =
  | "OCUSAL_INCISAL"
  | "MESIAL"
  | "DISTAL"
  | "VESTIBULAR_BUCAL"
  | "PALATINO_LINGUAL";

export type Pieza = {
  id_pieza: number;
  id_odontograma: number;
  numero_fdi: number;
  estado_general: EstadoPieza;
  esta_presente: boolean;
  notas?: string | null;
};

export type Superficie = {
  id_superficie: number;
  id_pieza: number;
  superficie: SuperficieCode | string;
  hallazgo?: string | null;
  detalle?: string | null;
  id_tratamiento_sugerido?: number | null;
  fdi?: number; // opcional si backend lo incluye
};

export type OdontogramaEntity = {
  id_odontograma?: number;
  id_historia?: number;
  is_draft?: boolean;
  // compat
  id?: number;
  idHistoria?: number;
};

export type OdontogramaResponse = {
  odontograma: OdontogramaEntity | null;
  piezas: Pieza[];
  superficies: Superficie[];
  estadoBucal?: any | null;
};

const API = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");

/* --------------------------- helpers HTTP --------------------------- */

async function httpJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  let json: any = null;
  try { json = await res.json(); } catch { /* puede no traer body */ }
  if (!res.ok) {
    const err: any = new Error(json?.mensaje || json?.error || res.statusText);
    err.status = res.status;
    err.payload = json;
    throw err;
  }
  return json;
}

/* ------------------------------- API ------------------------------- */

export async function getOdontogramaByHistoria(historiaId: string): Promise<OdontogramaResponse> {
  // Tenemos ese endpoint OK
  return httpJson(`${API}/historias/${historiaId}/odontograma`);
}

export async function abrirDraftOdontograma(params: {
  citaId: string | number;
  historiaId: number;
  userId?: number; // si usas JWT, puedes omitir
}) {
  const { citaId, historiaId, userId = 1 } = params;
  return httpJson(`${API}/citas/${citaId}/odontograma/abrir`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ historiaId, userId }),
  });
}

export async function patchPiezaEstado(params: {
  idOdontograma: number;
  fdi: number;
  estado?: string;
  presente?: boolean;
  notas?: string | null;
}) {
  const { idOdontograma, fdi, ...body } = params;
  return httpJson(`${API}/odontogramas/${idOdontograma}/piezas/${fdi}/estado`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function patchSuperficie(params: {
  idOdontograma: number;
  fdi: number;
  superficie: SuperficieCode;
  hallazgo?: string | null;
  detalle?: string | null;
}) {
  const { idOdontograma, fdi, superficie, ...body } = params;
  return httpJson(`${API}/odontogramas/${idOdontograma}/piezas/${fdi}/superficies/${superficie}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Ejecuta `op()` y si falla (400/404/409) intenta abrir draft con cita+historia y reintenta una vez. */
export async function withDraftRetry<T>(
  op: () => Promise<T>,
  ctx?: { citaId?: string; historiaId?: number }
): Promise<T> {
  try {
    return await op();
  } catch (e: any) {
    const retriable = e?.status === 400 || e?.status === 404 || e?.status === 409;
    if (retriable && ctx?.citaId && ctx?.historiaId) {
      await abrirDraftOdontograma({ citaId: ctx.citaId, historiaId: ctx.historiaId });
      return op();
    }
    throw e;
  }
}

/* ------------------------- helpers de UI --------------------------- */

export function superficiesPorFDI(piezas: Pieza[], superficies: Superficie[]) {
  const idPiezaToFDI = new Map<number, number>();
  piezas.forEach((p) => idPiezaToFDI.set(p.id_pieza, p.numero_fdi));
  const map = new Map<number, Superficie[]>();
  superficies.forEach((s) => {
    const fdi = s.fdi ?? idPiezaToFDI.get(s.id_pieza);
    if (!fdi) return;
    if (!map.has(fdi)) map.set(fdi, []);
    map.get(fdi)!.push({ ...s, fdi });
  });
  return map;
}

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

import { getTenantHeaders } from "@/lib/tenant";

async function httpJson(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...(init || {}),
    headers: { ...(init?.headers || {} as any), ...getTenantHeaders(), "Content-Type": "application/json", },
  });
  let json: any = null;
  try { json = await res.json(); } catch { /* puede no traer body */ }
  /* if (!res.ok) {
    const err: any = new Error(json?.mensaje || json?.error || res.statusText);
    err.status = res.status;
    err.payload = json;
    throw err;
  } */
  if (!res.ok) {
    const err: any = new Error(json?.mensaje || json?.error || res.statusText);
    err.status = res.status;
    err.payload = json;
    err.url = url;                 //  ayuda a depurar
    err.method = init?.method ?? "GET";
    // log visible en consola del navegador
    console.error(`[API ${res.status}] ${err.method} ${url}`, { body: init?.body, payload: json });
    throw err;
  }

  return json;
}

/* ------------------------------- API ------------------------------- */

export async function getOdontogramaByHistoria(historiaId: string): Promise<OdontogramaResponse> {
  // Alineado a prefijo real de backend
  return httpJson(`${API}/historias-clinicas/${historiaId}/odontograma`);
}

// Overloads para compatibilidad y nuevo endpoint solicitado
export async function abrirDraftOdontograma(
  idHistoria: number,
  mode?: "empty" | "from_last"
): Promise<any>;
export async function abrirDraftOdontograma(params: {
  citaId: string | number;
  historiaId: number;
  userId?: number; // si usas JWT, puedes omitir
}): Promise<any>;
export async function abrirDraftOdontograma(
  a: number | { citaId: string | number; historiaId: number; userId?: number },
  b: "empty" | "from_last" = "empty"
) {
  // Nueva firma solicitada: (idHistoria, mode)
  if (typeof a === "number") {
    const idHistoria = a;
    const mode = b ?? "empty";
    return httpJson(`${API}/historias-clinicas/${idHistoria}/odontograma/abrir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
  }

  // Compatibilidad: firma previa con citaId + historiaId
  const { citaId, historiaId, userId = 1 } = a;
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

/** Ejecuta `op()` y, si falla por consolidado u otros errores típicos, abre draft y reintenta una vez. */
export async function withDraftRetry<T>(
  op: () => Promise<T>,
  ctx?: { citaId?: string | number; historiaId?: number }
): Promise<T> {
  try {
    return await op();
  } catch (e: any) {
    const status: number | undefined = e?.status;
    const msg = String(e?.payload?.mensaje || e?.message || "").toLowerCase();

    const looksConsolidated =
      /consolidad/.test(msg) || /no se puede editar.*consolidado/.test(msg);

    // Algunos backends mal mapeados devuelven 500 para casos de estado inválido.
    const retriableStatus = status === 400 || status === 404 || status === 409 || (status === 500 && looksConsolidated);

    const canOpen = Boolean(ctx?.citaId && ctx?.historiaId);

    if (retriableStatus && canOpen) {
      // Abre draft y reintenta una única vez
      await abrirDraftOdontograma(ctx!.historiaId!);
      return op();
    }

    // No es caso de consolidado o no tenemos datos para abrir draft
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

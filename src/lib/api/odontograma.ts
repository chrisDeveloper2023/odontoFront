import { api } from "@/api/client";

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
  fdi?: number;
};

export type OdontogramaEntity = {
  id_odontograma: number;
  id_historia: number;
  is_draft: boolean;
  version: number;
};

export type OdontogramaResponse = {
  odontograma: OdontogramaEntity | null;
  piezas: Pieza[];
  superficies: Superficie[];
  estadoBucal?: Record<string, unknown> | null;
};

const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

async function parseJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await parseJson(res);
  if (!res.ok) {
    const error: any = new Error(
      (data && typeof data === "object" && "mensaje" in data && (data as any).mensaje) ||
        res.statusText ||
        "Error en la petición",
    );
    error.status = res.status;
    error.payload = data;
    throw error;
  }
  return data as T;
}

function withAuthHeaders(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers as HeadersInit | undefined);
  headers.set("Content-Type", "application/json");
  const authHeader = api.defaults.headers.common?.Authorization;
  if (authHeader) {
    headers.set("Authorization", authHeader as string);
  }
  const tenantHeader = api.defaults.headers.common?.["X-Tenant-ID"];
  if (tenantHeader) {
    headers.set("X-Tenant-ID", tenantHeader as string);
  }
  return {
    ...init,
    headers,
    credentials: "include",
  };
}

export async function getOdontogramaByHistoria(
  idHistoria: number,
  opts?: { vigente?: boolean },
): Promise<OdontogramaResponse> {
  const query = opts?.vigente ? "?vigente=true" : "";
  const res = await fetch(
    `${API_BASE}/historias-clinicas/${idHistoria}/odontograma${query}`,
    withAuthHeaders(),
  );
  return handleResponse<OdontogramaResponse>(res);
}

export async function abrirDraftOdontograma(
  idHistoria: number,
  mode: "empty" | "from_last" = "from_last",
): Promise<OdontogramaEntity> {
  const res = await fetch(
    `${API_BASE}/historias-clinicas/${idHistoria}/odontograma/abrir?mode=${mode}`,
    withAuthHeaders({ method: "POST" }),
  );
  return handleResponse<OdontogramaEntity>(res);
}

export async function consolidarOdontograma(idOdontograma: number): Promise<any> {
  const res = await fetch(
    `${API_BASE}/odontogramas/${idOdontograma}/consolidar`,
    withAuthHeaders({ method: "POST" }),
  );
  return handleResponse(res);
}

export async function patchPiezaEstado(params: {
  idOdontograma: number;
  fdi: number;
  estado?: string;
  presente?: boolean;
  notas?: string | null;
}) {
  const { idOdontograma, fdi, ...body } = params;
  const res = await fetch(
    `${API_BASE}/odontogramas/${idOdontograma}/piezas/${fdi}/estado`,
    withAuthHeaders({ method: "PATCH", body: JSON.stringify(body) }),
  );
  return handleResponse(res);
}

export async function patchSuperficie(params: {
  idOdontograma: number;
  fdi: number;
  superficie: SuperficieCode;
  hallazgo?: string | null;
  id_tratamiento_sugerido?: number | null;
  detalle?: string | null;
}) {
  const { idOdontograma, fdi, superficie, ...body } = params;
  const res = await fetch(
    `${API_BASE}/odontogramas/${idOdontograma}/piezas/${fdi}/superficies/${superficie}`,
    withAuthHeaders({ method: "PATCH", body: JSON.stringify(body) }),
  );
  return handleResponse(res);
}

export async function upsertEstadoBucal(idOdontograma: number, data: Record<string, any>) {
  const res = await fetch(
    `${API_BASE}/odontogramas/${idOdontograma}/estado-bucal`,
    withAuthHeaders({ method: "PUT", body: JSON.stringify(data ?? {}) }),
  );
  return handleResponse(res);
}

export async function withDraftRetry<T>(fn: () => Promise<T>, retryOpen: () => Promise<void>): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const status = error?.status ?? error?.response?.status;
    if (status === 409 || status === 412) {
      await retryOpen();
      return fn();
    }
    throw error;
  }
}

export function superficiesPorFDI(piezas: Pieza[], superficies: Superficie[]) {
  const idPiezaToFDI = new Map<number, number>();
  piezas.forEach((pieza) => idPiezaToFDI.set(pieza.id_pieza, pieza.numero_fdi));

  const bucket = new Map<number, Superficie[]>();
  superficies.forEach((superficie) => {
    const fdi = superficie.fdi ?? idPiezaToFDI.get(superficie.id_pieza);
    if (!fdi) return;
    if (!bucket.has(fdi)) bucket.set(fdi, []);
    bucket.get(fdi)!.push({ ...superficie, fdi });
  });

  return bucket;
}


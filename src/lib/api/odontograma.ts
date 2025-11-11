import { apiGet, apiPatch, apiPost, apiPut } from "@/api/client";

const HISTORIAS_BASE = "/historias-clinicas";

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
  version_token?: string | null;
};

export type OdontogramaResponse = {
  odontograma: OdontogramaEntity | null;
  piezas: Pieza[];
  superficies: Superficie[];
  estadoBucal?: Record<string, unknown> | null;
};

export type OdontoEventoTipo = "DIAGNOSTICO" | "PROCEDIMIENTO" | "NOTA" | "ESTADO_PIEZA";
export interface OdontoEventoDTO {
  id: number;
  tenant_id: number | null;
  historia_id: number;
  cita_id: number | null;
  fdi: number | null;
  tipo: OdontoEventoTipo;
  payload: any;
  created_by: number | null;
  fecha_creacion: string;
}

export async function getOdontogramaByHistoria(
  idHistoria: number,
  opts?: { vigente?: boolean; citaId?: string | number },
): Promise<OdontogramaResponse> {
  const params: Record<string, any> = {};
  if (opts?.vigente) params.vigente = true;
  if (opts?.citaId !== undefined && opts?.citaId !== null && opts?.citaId !== "") {
    params.citaId = String(opts.citaId);
  }
  return apiGet<OdontogramaResponse>(
    `${HISTORIAS_BASE}/${idHistoria}/odontograma`,
    Object.keys(params).length ? params : undefined,
  );
}

export async function abrirDraftOdontograma(
  idHistoria: number,
  mode: "empty" | "from_last" = "from_last",
): Promise<OdontogramaResponse> {
  const query = mode ? `?mode=${encodeURIComponent(mode)}` : "";
  return apiPost<OdontogramaResponse>(
    `${HISTORIAS_BASE}/${idHistoria}/odontograma/abrir${query}`,
  );
}

export async function consolidarOdontograma(
  idOdontograma: number,
  opts?: { versionToken?: string | null },
): Promise<any> {
  const headers =
    opts?.versionToken && opts.versionToken !== ""
      ? { "If-Match": opts.versionToken }
      : undefined;
  return apiPost(`/odontogramas/${idOdontograma}/consolidar`, undefined, headers ? { headers } : undefined);
}

export async function descartarOdontograma(
  idOdontograma: number,
  opts?: { versionToken?: string | null },
): Promise<any> {
  const headers =
    opts?.versionToken && opts.versionToken !== ""
      ? { "If-Match": opts.versionToken }
      : undefined;
  return apiPost(`/odontogramas/${idOdontograma}/descartar`, undefined, headers ? { headers } : undefined);
}

export async function patchPiezaEstado(params: {
  idOdontograma: number;
  fdi: number;
  estado?: string;
  presente?: boolean;
  notas?: string | null;
}) {
  const { idOdontograma, fdi, ...body } = params;
  return apiPatch(`/odontogramas/${idOdontograma}/piezas/${fdi}/estado`, body);
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
  return apiPatch(`/odontogramas/${idOdontograma}/piezas/${fdi}/superficies/${superficie}`, body);
}

export async function fetchEventosOdontograma(
  historiaId: number,
  params?: { fdi?: number; limit?: number },
): Promise<{ eventos: OdontoEventoDTO[] }> {
  return apiGet<{ eventos: OdontoEventoDTO[] }>(
    `${HISTORIAS_BASE}/${historiaId}/odontograma/eventos`,
    params,
  );
}

export async function upsertEstadoBucal(idOdontograma: number, data: Record<string, any>) {
  return apiPut(`/odontogramas/${idOdontograma}/estado-bucal`, data ?? {});
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

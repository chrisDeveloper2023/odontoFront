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
  opts?: { vigente?: boolean },
): Promise<OdontogramaResponse> {
  const config = opts?.vigente ? { params: { vigente: true } } : undefined;
  const res = await api.get<OdontogramaResponse>(
    `/historias-clinicas/${idHistoria}/odontograma`,
    config,
  );
  return res.data;
}

export async function abrirDraftOdontograma(
  idHistoria: number,
  mode: "empty" | "from_last" = "from_last",
): Promise<OdontogramaEntity> {
  const res = await api.post<OdontogramaEntity>(
    `/historias-clinicas/${idHistoria}/odontograma/abrir`,
    null,
    { params: { mode } },
  );
  return res.data;
}

export async function consolidarOdontograma(idOdontograma: number): Promise<any> {
  const res = await api.post(`/odontogramas/${idOdontograma}/consolidar`);
  return res.data;
}

export async function patchPiezaEstado(params: {
  idOdontograma: number;
  fdi: number;
  estado?: string;
  presente?: boolean;
  notas?: string | null;
}) {
  const { idOdontograma, fdi, ...body } = params;
  const res = await api.patch(`/odontogramas/${idOdontograma}/piezas/${fdi}/estado`, body);
  return res.data;
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
  const res = await api.patch(
    `/odontogramas/${idOdontograma}/piezas/${fdi}/superficies/${superficie}`,
    body,
  );
  return res.data;
}

export async function fetchEventosOdontograma(
  historiaId: number,
  params?: { fdi?: number; limit?: number },
): Promise<{ eventos: OdontoEventoDTO[] }> {
  const res = await api.get<{ eventos: OdontoEventoDTO[] }>(
    `/historias-clinicas/${historiaId}/odontograma/eventos`,
    { params },
  );
  return res.data;
}

export async function upsertEstadoBucal(idOdontograma: number, data: Record<string, any>) {
  const res = await api.put(`/odontogramas/${idOdontograma}/estado-bucal`, data ?? {});
  return res.data;
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

export type EstadoPieza =
  | "SANO"
  | "AUSENTE"
  | "EXTRACCION_INDICADA"
  | "CARIES"
  | "OBTURADO"
  | "ENDODONCIA"
  | "CORONA"
  | "IMPLANTE"
  | "PROTESIS_FIJA"
  | "PROTESIS_REMOVIBLE"
  | "FRACTURA"
  | "MOVILIDAD";

export type SuperficieCode =
  | "OCUSAL_INCISAL"
  | "MESIAL"
  | "DISTAL"
  | "VESTIBULAR_BUCAL"
  | "PALATINO_LINGUAL";

export interface Superficie {
  id_superficie: number;
  id_pieza: number;
  superficie: SuperficieCode;
  hallazgo: EstadoPieza | null;
  detalle: string | null;
  id_tratamiento_sugerido: number | null;
  fdi?: number;
}

export interface Pieza {
  id_pieza: number;
  id_odontograma: number;
  numero_fdi: number;
  estado_general: EstadoPieza;
  esta_presente: boolean;
  notas?: string | null;
  superficies: Superficie[];
}

export interface OdontogramaEntity {
  id_odontograma: number;
  id_historia: number;
  cita_id?: number | null;
  version: number;
  is_draft: boolean;
  created_by?: number | null;
  updated_by?: number | null;
  fecha_creacion: string;
  fecha_modificacion: string;
}

export interface OdontogramaResponse {
  odontograma: OdontogramaEntity | null;
  piezas: Pieza[];
  superficies: Superficie[];
  estadoBucal?: any | null;
}

import type { Clinica } from "@/types/clinica";

export interface OdontogramaPiece {
  id_pieza: number;
  id_odontograma: number;
  numero_fdi?: number;
  odontograma?: {
    id_odontograma: number;
    id_historia: number;
  } | null;
}

export interface Treatment {
  id_tratamiento: number;
  nombre: string;
  descripcion?: string | null;
  costo_base: number;
  id_clinica?: number | null;
  clinica?: Clinica | null;
  id_pieza?: number | null;
  pieza?: OdontogramaPiece | null;
  facturado: boolean;
  pagado: boolean;
  fecha_creacion?: string | null;
  fecha_modificacion?: string | null;
}

export interface TreatmentPayload {
  nombre: string;
  descripcion?: string | null;
  costo_base: number;
  id_clinica?: number | null;
  id_pieza?: number | null;
  facturado?: boolean;
  pagado?: boolean;
}

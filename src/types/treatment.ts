import type { Clinica } from "@/types/clinica";
import type { HistoriaClinica } from "@/types/historiaClinica";
import type { OdontogramaResponse } from "@/lib/api/odontograma";

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
  id_historia?: number | null;
  historia?: Pick<HistoriaClinica, "id_historia" | "id_paciente" | "id_clinica" | "paciente" | "clinica"> | null;
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
  id_historia: number;
  id_clinica?: number | null;
  id_pieza?: number | null;
  facturado?: boolean;
  pagado?: boolean;
}

export interface TreatmentsContext {
  historia: HistoriaClinica;
  tratamientos: Treatment[];
  odontograma: Pick<OdontogramaResponse, "odontograma" | "piezas" | "superficies" | "estadoBucal"> | null;
}

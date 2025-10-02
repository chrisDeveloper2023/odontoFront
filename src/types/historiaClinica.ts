import type { Clinica } from "@/types/clinica";
import type { Tenant } from "@/types/tenant";

export interface HistoriaClinica {
  id_historia: number;
  id_paciente: number;
  id_clinica: number | null;
  id_cita: number | null;
  detalles_generales?: string | null;
  motivo_consulta?: string | null;
  fecha_creacion?: string | null;
  fecha_modificacion?: string | null;
  clinica?: Clinica | null;
  tenant?: Tenant | null;
  paciente?: {
    id_paciente: number;
    nombres?: string;
    apellidos?: string;
  } | null;
  cita?: {
    id_cita: number;
    fecha_hora?: string | null;
  } | null;
  [key: string]: unknown;
}

export interface HistoriaClinicaList {
  items: HistoriaClinica[];
  total?: number;
  totalPages?: number;
}

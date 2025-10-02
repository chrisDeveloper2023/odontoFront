import type { Tenant } from "./tenant";

export interface Clinica {
  id_clinica: number;
  id?: number; // alias para consumo en UI
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  correo?: string | null;
  activo: boolean;
  tenant_id: number | null;
  tenant?: Tenant | null;
}

export type ClinicaSummary = Pick<Clinica, "id_clinica" | "nombre" | "tenant_id">;

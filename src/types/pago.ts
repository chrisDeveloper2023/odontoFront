import type { Clinica } from "@/types/clinica";
import type { Tenant } from "@/types/tenant";

export interface Pago {
  id_pago: number;
  id_factura?: number | null;
  id_cita?: number | null;
  monto: number;
  moneda?: string | null;
  fecha_pago?: string | null;
  estado?: string | null;
  descripcion?: string | null;
  clinica?: Clinica | null;
  tenant?: Tenant | null;
  metodo_pago?: string | null;
  [key: string]: unknown;
}

export interface PagoList {
  items: Pago[];
  total?: number;
  totalPages?: number;
}

export interface PagoPayload {
  monto: number;
  metodo_pago?: string | null;
  descripcion?: string | null;
  id_factura?: number | null;
  id_cita?: number | null;
  clinica_id?: number | null;
  tenant_id?: number | null;
}

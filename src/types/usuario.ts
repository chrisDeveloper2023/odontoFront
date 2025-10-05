import type { Clinica } from "./clinica";
import type { Rol } from "./rol";
import type { Tenant } from "./tenant";

export interface Usuario {
  id: number;
  id_clinica: number | null;
  tenant_id: number | null;
  nombres: string;
  apellidos: string;
  correo: string;
  activo: boolean;
  rol: Rol;
  clinica?: Clinica | null;
  tenant?: Tenant | null;
  roles?: string[]; // compat: login puede enviar arreglo de roles
  tenantSlug?: string | null; // compat: login devuelve slug directo
  permissions?: string[]; // permisos del usuario
}

export interface UsuarioPayload {
  nombres: string;
  apellidos: string;
  correo: string;
  activo?: boolean;
  id_clinica?: number | null;
  tenant_id?: number | null;
  rol_id?: number;
}

export type UsuarioCreatePayload = UsuarioPayload;
export type UsuarioUpdatePayload = UsuarioPayload;

export interface UsuariosResponse {
  data: Usuario[];
  total?: number;
  totalPages?: number;
}

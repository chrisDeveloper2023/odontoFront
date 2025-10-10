import { apiGet, apiPost, apiPut, apiDelete } from "@/api/client";

export interface Permiso {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string;
  modulo: string;
  activo: boolean;
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion?: string;
  permisos: Permiso[];
  activo: boolean;
}

export interface PermisosResponse {
  data: Permiso[];
  total?: number;
  totalPages?: number;
}

export interface RolesResponse {
  data: Rol[];
  total?: number;
  totalPages?: number;
}

export const getPermisos = async (params?: Record<string, any>): Promise<PermisosResponse> => {
  return apiGet<PermisosResponse>("/permisos", params);
};

export const getPermiso = async (id: number): Promise<Permiso> => {
  return apiGet<Permiso>(`/permisos/${id}`);
};

/**
 * Obtiene todos los roles disponibles.
 * Devuelve un objeto homogeneo aunque la API responda con un array plano.
 */
export const getRoles = async (params?: Record<string, any>): Promise<RolesResponse> => {
  const res = await apiGet<unknown>("/roles", params);
  if (Array.isArray(res)) {
    return { data: res as Rol[] };
  }
  if (res && typeof res === "object") {
    const payload = res as Partial<RolesResponse> & { data?: unknown };
    if (Array.isArray(payload.data)) {
      return { ...payload, data: payload.data as Rol[] };
    }
  }
  return { data: [] };
};

export const getRol = async (id: number): Promise<Rol> => {
  return apiGet<Rol>(`/roles/${id}`);
};

export const createRol = async (rol: Partial<Rol>): Promise<Rol> => {
  return apiPost<Rol>("/roles", rol);
};

export const updateRol = async (id: number, rol: Partial<Rol>): Promise<Rol> => {
  return apiPut<Rol>(`/roles/${id}`, rol);
};

export const deleteRol = async (id: number): Promise<void> => {
  return apiDelete(`/roles/${id}`);
};

export const assignPermisosToRol = async (rolId: number, permisoIds: number[]): Promise<Rol> => {
  return apiPost<Rol>(`/roles/${rolId}/permisos`, { permiso_ids: permisoIds });
};

export const getUserPermisos = async (userId: number): Promise<Permiso[]> => {
  return apiGet<Permiso[]>(`/usuarios/${userId}/permisos`);
};

export const getCurrentUserPermisos = async (): Promise<Permiso[]> => {
  return apiGet<Permiso[]>('/usuarios/me/permisos');
};

export const checkPermission = async (codigo: string): Promise<boolean> => {
  try {
    const response = await apiGet<{ hasPermission: boolean }>(`/permisos/check/${codigo}`);
    return response.hasPermission;
  } catch {
    return false;
  }
};

export const getPermisosByModulo = async (): Promise<Record<string, Permiso[]>> => {
  const permisos = await getPermisos();
  const grouped: Record<string, Permiso[]> = {};

  permisos.data.forEach((permiso) => {
    if (!grouped[permiso.modulo]) {
      grouped[permiso.modulo] = [];
    }
    grouped[permiso.modulo].push(permiso);
  });

  return grouped;
};

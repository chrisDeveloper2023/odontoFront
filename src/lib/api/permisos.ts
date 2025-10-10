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

/**
 * Obtiene todos los permisos disponibles
 */
export const getPermisos = async (params?: Record<string, any>): Promise<PermisosResponse> => {
  return apiGet<PermisosResponse>("/permisos", params);
};

/**
 * Obtiene un permiso específico por ID
 */
export const getPermiso = async (id: number): Promise<Permiso> => {
  return apiGet<Permiso>(`/permisos/${id}`);
};

/**
 * Obtiene todos los roles disponibles
 */
export const getRoles = async (params?: Record<string, any>): Promise<RolesResponse> => {
  const res = await apiGet<unknown>("/roles", params);
  if (Array.isArray(res)) {
    return { data: res as Rol[] };
  }
  if (res && typeof res === "object" && Array.isArray((res as any).data)) {
    const data = (res as any).data as Rol[];
    const rest = { ...res } as RolesResponse;
    rest.data = data;
    return rest;
  }
  return { data: [] };
};

/**
 * Obtiene un rol específico por ID
 */
export const getRol = async (id: number): Promise<Rol> => {
  return apiGet<Rol>(`/roles/${id}`);
};

/**
 * Crea un nuevo rol
 */
export const createRol = async (rol: Partial<Rol>): Promise<Rol> => {
  return apiPost<Rol>("/roles", rol);
};

/**
 * Actualiza un rol existente
 */
export const updateRol = async (id: number, rol: Partial<Rol>): Promise<Rol> => {
  return apiPut<Rol>(`/roles/${id}`, rol);
};

/**
 * Elimina un rol
 */
export const deleteRol = async (id: number): Promise<void> => {
  return apiDelete(`/roles/${id}`);
};

/**
 * Asigna permisos a un rol
 */
export const assignPermisosToRol = async (rolId: number, permisoIds: number[]): Promise<Rol> => {
  return apiPost<Rol>(`/roles/${rolId}/permisos`, { permiso_ids: permisoIds });
};

/**
 * Obtiene los permisos de un usuario específico
 */
export const getUserPermisos = async (userId: number): Promise<Permiso[]> => {
  return apiGet<Permiso[]>(`/usuarios/${userId}/permisos`);
};

/**
 * Obtiene los permisos del usuario actual
 */
export const getCurrentUserPermisos = async (): Promise<Permiso[]> => {
  return apiGet<Permiso[]>("/usuarios/me/permisos");
};

/**
 * Verifica si el usuario actual tiene un permiso específico
 */
export const checkPermission = async (codigo: string): Promise<boolean> => {
  try {
    const response = await apiGet<{ hasPermission: boolean }>(`/permisos/check/${codigo}`);
    return response.hasPermission;
  } catch {
    return false;
  }
};

/**
 * Obtiene permisos agrupados por módulo
 */
export const getPermisosByModulo = async (): Promise<Record<string, Permiso[]>> => {
  const permisos = await getPermisos();
  const grouped: Record<string, Permiso[]> = {};
  
  permisos.data.forEach(permiso => {
    if (!grouped[permiso.modulo]) {
      grouped[permiso.modulo] = [];
    }
    grouped[permiso.modulo].push(permiso);
  });
  
  return grouped;
};

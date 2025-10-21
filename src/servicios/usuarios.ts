import {
  fetchUsuario,
  fetchUsuarios,
  createUsuario as createUsuarioApi,
  updateUsuario as updateUsuarioApi,
  deleteUsuario as deleteUsuarioApi,
} from "@/lib/api/usuarios";
import { getOdontologos as fetchCatalogOdontologos } from "@/lib/api/catalog";
import type { CreateUsuarioResult } from "@/lib/api/usuarios";
import type { Usuario, UsuarioPayload } from "@/types/usuario";
import { ROLE_NAMES } from "@/constants/roles";

export type Doctor = Pick<
  Usuario,
  "id" | "nombres" | "apellidos" | "rol" | "clinica" | "tenant" | "id_clinica" | "tenant_id"
>;

export async function getOdontologos(): Promise<Doctor[]> {
  try {
    const res = await fetchCatalogOdontologos();
    const arr = Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : [];
    return arr
      .map((item: any) => {
        const id = Number(item?.id ?? item?.id_usuario ?? 0);
        if (!Number.isFinite(id) || id <= 0) return null;
        const nombres = String(item?.nombres ?? "").trim();
        const apellidos = String(item?.apellidos ?? "").trim();
        const rolIdRaw = Number(item?.rol?.id ?? item?.rol?.id_rol ?? 0);
        const rolNombre = String(item?.rol?.nombre ?? item?.rol?.nombre_rol ?? "").trim();
        const rolId = Number.isFinite(rolIdRaw) && rolIdRaw > 0 ? rolIdRaw : 0;
        return {
          id,
          nombres,
          apellidos,
          id_clinica: Number.isFinite(Number(item?.id_clinica)) ? Number(item?.id_clinica) : null,
          tenant_id: Number.isFinite(Number(item?.tenant_id)) ? Number(item?.tenant_id) : null,
          rol: {
            id_rol: rolId,
            nombre_rol: rolNombre,
          },
          clinica: null,
          tenant: null,
        } as Doctor;
      })
      .filter((u): u is Doctor => Boolean(u));
  } catch (error) {
    console.error("No se pudo cargar catalogo de odontologos", error);
    return [];
  }
}

export async function listUsuarios(): Promise<Usuario[]> {
  return fetchUsuarios();
}

export async function getUsuario(id: number): Promise<Usuario | null> {
  return fetchUsuario(id);
}

export async function createUsuario(payload: UsuarioPayload): Promise<CreateUsuarioResult> {
  return createUsuarioApi(payload);
}

export async function updateUsuario(id: number, payload: UsuarioPayload): Promise<Usuario> {
  return updateUsuarioApi(id, payload);
}

export async function deleteUsuario(id: number): Promise<void> {
  return deleteUsuarioApi(id);
}


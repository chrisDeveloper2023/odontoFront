import {
  fetchUsuario,
  fetchUsuarios,
  createUsuario as createUsuarioApi,
  updateUsuario as updateUsuarioApi,
  deleteUsuario as deleteUsuarioApi,
} from "@/lib/api/usuarios";
import type { CreateUsuarioResult } from "@/lib/api/usuarios";
import type { Usuario, UsuarioPayload } from "@/types/usuario";
import { ROLE_NAMES } from "@/constants/roles";

export type Doctor = Pick<
  Usuario,
  "id" | "nombres" | "apellidos" | "rol" | "clinica" | "tenant" | "id_clinica" | "tenant_id"
>;

const isOdontologo = (usuario: Usuario) => {
  const rolNombre = usuario.rol?.nombre_rol?.toUpperCase?.() ?? "";
  if (rolNombre.includes(ROLE_NAMES.ODONTOLOGO.toUpperCase())) return true;
  return (
    Array.isArray(usuario.roles) &&
    usuario.roles.some((role) => String(role).toUpperCase().includes(ROLE_NAMES.ODONTOLOGO.toUpperCase()))
  );
};

export async function getOdontologos(): Promise<Doctor[]> {
  const usuarios = await fetchUsuarios();
  return usuarios.filter(isOdontologo);
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


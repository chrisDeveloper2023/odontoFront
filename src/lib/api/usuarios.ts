import { apiDelete, apiGet, apiPost, apiPut } from "@/api/client";
import { ensureArray, mapUsuario } from "./mappers";
import type { Usuario, UsuarioPayload } from "@/types/usuario";

const buildUsuarioPayload = (payload: UsuarioPayload) => {
  const body: Record<string, any> = {
    nombres: payload.nombres,
    apellidos: payload.apellidos,
    correo: payload.correo,
  };

  if (payload.activo !== undefined) body.activo = Boolean(payload.activo);
  if (payload.rol_id !== undefined) body.rol_id = payload.rol_id;

  if (payload.id_clinica !== undefined) {
    body.id_clinica = payload.id_clinica;
  }

  if ((payload.id_clinica === undefined || payload.id_clinica === null) && payload.tenant_id !== undefined) {
    body.tenant_id = payload.tenant_id;
  }

  return body;
};

export async function fetchUsuarios(): Promise<Usuario[]> {
  const res = await apiGet<unknown>("/usuarios");
  return ensureArray(res).map(mapUsuario);
}

export async function fetchUsuario(id: number): Promise<Usuario | null> {
  const res = await apiGet<unknown>(`/usuarios/${id}`);
  if (!res) return null;
  return mapUsuario(res);
}

export interface CreateUsuarioResult {
  usuario: Usuario;
  generatedPassword?: string;
}

export async function createUsuario(payload: UsuarioPayload): Promise<CreateUsuarioResult> {
  const res = await apiPost<any>("/usuarios", buildUsuarioPayload(payload));
  const generatedPassword = typeof res === "object" ? res?.generatedPassword : undefined;
  return {
    usuario: mapUsuario(res),
    generatedPassword: generatedPassword ? String(generatedPassword) : undefined,
  };
}

export async function updateUsuario(id: number, payload: UsuarioPayload): Promise<Usuario> {
  const res = await apiPut<unknown>(`/usuarios/${id}`, buildUsuarioPayload(payload));
  return mapUsuario(res);
}

export async function deleteUsuario(id: number): Promise<void> {
  await apiDelete(`/usuarios/${id}`);
}

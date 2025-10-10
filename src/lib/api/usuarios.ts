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

  if (payload.password) {
    body.password = payload.password;
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
  tempPassword?: string;
}

export async function createUsuario(payload: UsuarioPayload): Promise<CreateUsuarioResult> {
  const res = await apiPost<any>("/usuarios", buildUsuarioPayload(payload));
  const rawUser = res?.user ?? res;
  const tempPassword = res?.tempPassword ?? res?.generatedPassword ?? res?.passwordTemporal;
  return {
    usuario: mapUsuario(rawUser),
    tempPassword: typeof tempPassword === "string" && tempPassword.length > 0 ? tempPassword : undefined,
  };
}

export async function updateUsuario(id: number, payload: UsuarioPayload): Promise<Usuario> {
  const res = await apiPut<any>(`/usuarios/${id}`, buildUsuarioPayload(payload));
  const raw = res?.user ?? res;
  return mapUsuario(raw);
}

export async function deleteUsuario(id: number): Promise<void> {
  await apiDelete(`/usuarios/${id}`);
}

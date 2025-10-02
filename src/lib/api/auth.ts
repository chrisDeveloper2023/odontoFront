import { apiPost } from "@/api/client";
import type { AuthSession } from "@/lib/auth";
import { mapUsuario } from "./mappers";

interface RawAuthResponse {
  token: string;
  expiresIn: number;
  usuario: any;
}

export async function login(correo: string, password: string): Promise<AuthSession> {
  const res = await apiPost<RawAuthResponse>("/auth/login", { correo, password });
  const usuario = mapUsuario(res.usuario);

  return {
    token: res.token,
    expiresIn: res.expiresIn,
    usuario,
  };
}

import { apiPost } from "@/api/client";
import type { AuthSession } from "@/lib/auth";

export async function login(correo: string, password: string): Promise<AuthSession> {
  // login va directo al endpoint /auth/login (sin /api)
  return apiPost<AuthSession>("/auth/login", { correo, password });
}


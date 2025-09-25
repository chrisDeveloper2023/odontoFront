import { apiPost } from "@/api/client";
import type { AuthSession } from "@/lib/auth";

export async function login(correo: string, password: string): Promise<AuthSession> {
  return apiPost<AuthSession>("/auth/login", { correo, password });
}
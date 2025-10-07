import api from "./axiosInstance";

export async function refreshToken(): Promise<string> {
  const response = await api.post<{ token: string }>("/auth/refresh");
  return response.data.token;
}

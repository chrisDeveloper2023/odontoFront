import api from "@/lib/api/axiosInstance";

export interface Notificacion {
  id_notificacion: number;
  id_clinica: number;
  id_usuario_destino: number;
  tipo: string;
  mensaje: string;
  leida: boolean;
  fecha_creacion: string;
}

export async function getNotificaciones(): Promise<Notificacion[]> {
  const res = await api.get("/notificaciones");
  return res.data?.data ?? [];
}

export async function marcarComoLeida(id: number): Promise<void> {
  await api.patch(`/notificaciones/${id}/leida`);
}

export async function marcarTodasComoLeidas(): Promise<void> {
  await api.patch("/notificaciones/marcar-todas");
}

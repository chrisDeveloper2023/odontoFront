import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  getNotificaciones,
  marcarComoLeida,
  marcarTodasComoLeidas,
  Notificacion,
} from "../services/notificationService";

interface NotificationContextType {
  notificaciones: Notificacion[];
  unreadCount: number;
  refresh: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  const refresh = useCallback(async () => {
    try {
      const data = await getNotificaciones();
      setNotificaciones(data);
    } catch (error) {
      console.error("Error cargando notificaciones:", error);
    }
  }, []);

  const markAsRead = useCallback(
    async (id: number) => {
      try {
        await marcarComoLeida(id);
        await refresh();
      } catch (error) {
        console.error("Error marcando notificacion como leida:", error);
      }
    },
    [refresh]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await marcarTodasComoLeidas();
      await refresh();
    } catch (error) {
      console.error("Error marcando todas como leidas:", error);
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  const unreadCount = useMemo(
    () => notificaciones.filter((notification) => !notification.leida).length,
    [notificaciones]
  );

  return (
    <NotificationContext.Provider value={{ notificaciones, unreadCount, refresh, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications debe usarse dentro de <NotificationProvider>");
  }
  return context;
}


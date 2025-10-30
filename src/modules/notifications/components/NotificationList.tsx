import { useNotifications } from "../context/NotificationContext";
import { useHasPermission } from "@/context/AuthContext";

export function NotificationList() {
  const { notificaciones, markAsRead, markAllAsRead } = useNotifications();
  const hasPermission = useHasPermission();
  const canManage = hasPermission("notifications:manage");

  if (!notificaciones.length) {
    return <p className="p-4 text-gray-500">Sin notificaciones.</p>;
  }

  return (
    <div className="w-80 rounded-xl bg-white p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold">Notificaciones</h3>
        {canManage ? (
          <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:underline" type="button">
            Marcar todas como leidas
          </button>
        ) : null}
      </div>
      <ul className="max-h-96 overflow-y-auto">
        {notificaciones.map((n) => (
          <li
            key={n.id_notificacion}
            onClick={() => markAsRead(n.id_notificacion)}
            className={`mb-1 cursor-pointer rounded-lg p-2 hover:bg-blue-100 ${
              n.leida ? "bg-gray-50" : "bg-blue-50"
            }`}
          >
            <p className="text-sm">{n.mensaje}</p>
            <span className="text-xs text-gray-400">{new Date(n.fecha_creacion).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

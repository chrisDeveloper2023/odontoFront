import { NotificationList } from "../components/NotificationList";

export default function NotificationsPage() {
  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-semibold">Centro de Notificaciones</h1>
      <NotificationList />
    </div>
  );
}

import { Bell } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";

export function NotificationBell({ onClick }: { onClick?: () => void }) {
  const { unreadCount } = useNotifications();

  return (
    <button className="relative p-2" onClick={onClick} type="button">
      <Bell className="h-6 w-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 rounded-full bg-red-500 px-1 text-xs text-white">
          {unreadCount}
        </span>
      )}
    </button>
  );
}

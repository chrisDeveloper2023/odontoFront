import { toast } from "sonner";
import type { ReactNode } from "react";

type NotifyType = "success" | "error" | "warning" | "info" | "loading";

interface NotifyOptions {
  type?: NotifyType;
  title?: ReactNode;
  description?: ReactNode;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  id?: string | number;
}

const DEFAULT_DURATION: Record<NotifyType, number> = {
  success: 3500,
  error: 5000,
  warning: 4500,
  info: 3500,
  loading: 0,
};

function resolveDuration(type: NotifyType, duration?: number) {
  if (typeof duration === "number") return duration;
  return DEFAULT_DURATION[type] ?? 3500;
}

export function notify(opts: NotifyOptions) {
  const { type = "info", title, description, duration, action, dismissible = true, id } = opts;
  const config = {
    duration: resolveDuration(type, duration),
    action,
    id,
    dismissible,
    description,
  };

  switch (type) {
    case "success":
      return toast.success(title ?? "Operación exitosa", config);
    case "error":
      return toast.error(title ?? "Ocurrió un error", config);
    case "warning":
      return toast.warning(title ?? "Atención", config);
    case "loading":
      return toast.loading(title ?? "Procesando...", config);
    case "info":
    default:
      return toast.info?.(title ?? "Información", config) ?? toast(title ?? "Información", config);
  }
}

export function notifyPromise<T>(
  promise: Promise<T>,
  messages: {
    loading?: string;
    success?: string;
    error?: string;
  },
) {
  return toast.promise(promise, {
    loading: messages.loading ?? "Procesando...",
    success: messages.success ?? "Completado",
    error: messages.error ?? "Algo salió mal",
  });
}


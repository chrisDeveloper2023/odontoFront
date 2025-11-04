import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";

import { obtenerHistorialCita, type CitaHistorialEntry } from "@/servicios/citas";
import { formatGuayaquilDate, formatGuayaquilTimeHM } from "@/lib/timezone";

type CitaHistorialModalProps = {
  open: boolean;
  onClose: () => void;
  citaId: number | null;
  patientName?: string;
  currentStatus?: string;
};

type RawHistorialItem = CitaHistorialEntry & Record<string, unknown>;

type NormalizedHistorialItem = {
  id: string;
  fechaRaw: string;
  fechaLegible: string;
  estadoAnterior: string;
  estadoNuevo: string;
  motivo: string;
  usuario: string;
};

const pickString = (item: RawHistorialItem, keys: string[]): string | undefined => {
  for (const key of keys) {
    const raw = item[key];
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return undefined;
};

const getRecordString = (record: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return "";
};

const formatStatus = (value: unknown): string => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed.toUpperCase() : "-";
  }
  return "-";
};

const pickValue = (item: RawHistorialItem, keys: string[]): unknown => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(item, key)) {
      const value = item[key];
      if (value !== undefined && value !== null) {
        return value;
      }
    }
  }
  return undefined;
};

const extractUsuario = (item: RawHistorialItem): string => {
  const rawUsuario = item.usuario;
  if (typeof rawUsuario === "string") {
    const trimmed = rawUsuario.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  if (rawUsuario && typeof rawUsuario === "object") {
    const record = rawUsuario as Record<string, unknown>;
    const firstName = getRecordString(record, ["nombres", "nombre"]);
    const lastName = getRecordString(record, ["apellidos", "apellido"]);
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName.length > 0) {
      return fullName;
    }
    const email = getRecordString(record, ["email", "correo"]);
    if (email.length > 0) {
      return email;
    }
  }

  const fallback = pickString(item, ["usuario_nombre", "usuarioNombre", "usuario"]);
  return fallback ?? "Sistema";
};

const formatDateLabel = (value: string): string => {
  if (!value) return "-";
  const dateLabel = formatGuayaquilDate(value, { dateStyle: "medium" }) || "";
  const timeLabel = formatGuayaquilTimeHM(value) || "";
  const label = [dateLabel, timeLabel].filter(Boolean).join(" - ");
  return label || value;
};

const normalizeHistorialItem = (item: RawHistorialItem, index: number): NormalizedHistorialItem => {
  const fechaRaw =
    pickString(item, [
      "fecha_cambio",
      "fechaCambio",
      "fecha",
      "fecha_hora",
      "created_at",
      "updated_at",
      "creado_en",
    ]) ?? "";
  const estadoAnterior = formatStatus(
    pickString(item, ["estado_anterior", "estadoAnterior", "estado_previo", "estado_prev"]),
  );
  const estadoNuevo = formatStatus(
    pickString(item, ["estado_nuevo", "estadoNuevo", "estado_actual", "estado"]),
  );
  const motivo =
    pickString(item, ["motivo", "comentario", "observacion", "observaciones", "descripcion"]) ?? "-";
  const usuario = extractUsuario(item);
  const idRaw = pickValue(item, ["id", "id_historial", "idHistorial", "uuid", "codigo"]);
  const id =
    typeof idRaw === "number" || typeof idRaw === "string" ? String(idRaw) : `historial-${index}`;

  return {
    id,
    fechaRaw,
    fechaLegible: formatDateLabel(fechaRaw),
    estadoAnterior,
    estadoNuevo,
    motivo,
    usuario,
  };
};

const resolveBadgeVariant = (status: string): BadgeProps["variant"] => {
  switch (status.toUpperCase()) {
    case "REALIZADA":
      return "success";
    case "CANCELADA":
      return "destructive";
    case "CONFIRMADA":
      return "secondary";
    default:
      return "outline";
  }
};

const CitaHistorialModal = ({
  open,
  onClose,
  citaId,
  patientName,
  currentStatus,
}: CitaHistorialModalProps) => {
  const normalizedCitaId =
    typeof citaId === "number" && Number.isFinite(citaId) && citaId > 0 ? citaId : null;

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<CitaHistorialEntry[]>({
    queryKey: ["cita-historial", normalizedCitaId],
    queryFn: async () => {
      if (!normalizedCitaId) return [];
      return obtenerHistorialCita(normalizedCitaId);
    },
    enabled: open && normalizedCitaId !== null,
    staleTime: 10_000,
  });

  const items = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    return list.map((entry, index) => normalizeHistorialItem(entry as RawHistorialItem, index));
  }, [data]);

  const isEmpty = !isLoading && items.length === 0;
  const errorMessage =
    isError && error instanceof Error
      ? error.message || "No se pudo cargar el historial."
      : isError
        ? "No se pudo cargar el historial."
        : null;

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Historial de la cita</DialogTitle>
          <DialogDescription>
            Revisa los cambios de estado y comentarios registrados para la cita seleccionada.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-sm">
            {patientName ? <p className="font-medium text-foreground">{patientName}</p> : null}
            {normalizedCitaId ? (
              <p className="text-muted-foreground">ID cita: {normalizedCitaId}</p>
            ) : null}
            {currentStatus ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Estado actual:</span>
                <Badge variant={resolveBadgeVariant(currentStatus)}>{currentStatus}</Badge>
              </div>
            ) : null}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching || normalizedCitaId === null}
          >
            {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Actualizar
          </Button>
        </div>

        {isLoading ? (
          <div className="flex min-h-[180px] items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : errorMessage ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : isEmpty ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No se registran cambios en el historial de esta cita.
          </div>
        ) : (
          <div className="max-h-80 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha de cambio</TableHead>
                  <TableHead>Estado anterior</TableHead>
                  <TableHead>Estado nuevo</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Usuario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap">{item.fechaLegible}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={resolveBadgeVariant(item.estadoAnterior)}>
                        {item.estadoAnterior}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={resolveBadgeVariant(item.estadoNuevo)}>
                        {item.estadoNuevo}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.motivo || "-"}</TableCell>
                    <TableCell className="whitespace-nowrap">{item.usuario}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CitaHistorialModal;

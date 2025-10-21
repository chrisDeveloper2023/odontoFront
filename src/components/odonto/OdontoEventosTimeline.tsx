import React from "react";
import type { OdontoEventoDTO, OdontoEventoTipo } from "@/lib/api/odontograma";

function tipoBadge(tipo: OdontoEventoTipo) {
  const map: Record<OdontoEventoTipo, string> = {
    ESTADO_PIEZA: "Estado pieza",
    DIAGNOSTICO: "Diagnóstico",
    PROCEDIMIENTO: "Procedimiento",
    NOTA: "Nota",
  };
  return map[tipo] ?? tipo;
}

function payloadResumen(evento: OdontoEventoDTO): string {
  try {
    if (evento.tipo === "ESTADO_PIEZA") {
      const { estado, presente, notas } = evento.payload || {};
      return `FDI ${evento.fdi ?? "-"} → ${estado ?? "—"}${
        presente === false ? " (ausente)" : ""
      }${notas ? ` · ${notas}` : ""}`;
    }
    if (evento.tipo === "DIAGNOSTICO") {
      const { superficie, hallazgo, detalle } = evento.payload || {};
      return `FDI ${evento.fdi ?? "-"} ${superficie ?? ""} → ${hallazgo ?? ""}${
        detalle ? ` · ${detalle}` : ""
      }`;
    }
    if (evento.tipo === "PROCEDIMIENTO") {
      const { procedimiento, detalle } = evento.payload || {};
      return `FDI ${evento.fdi ?? "-"} → ${procedimiento ?? ""}${
        detalle ? ` · ${detalle}` : ""
      }`;
    }
    if (evento.tipo === "NOTA") {
      const { texto } = evento.payload || {};
      return `${texto ?? ""}`;
    }
  } catch {
    // ignore parsing errors and fall back to JSON below
  }
  try {
    return JSON.stringify(evento.payload ?? {});
  } catch {
    return String(evento.payload ?? "");
  }
}

export default function OdontoEventosTimeline({ eventos }: { eventos: OdontoEventoDTO[] }) {
  if (!eventos?.length) {
    return <div className="text-sm text-muted-foreground">Sin eventos</div>;
  }

  return (
    <div className="space-y-3">
      {eventos.map((evento) => (
        <div key={evento.id} className="flex items-start gap-3">
          <div className="mt-1 h-2 w-2 rounded-full bg-foreground/60" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                {tipoBadge(evento.tipo)}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(evento.fecha_creacion).toLocaleString()}
              </span>
            </div>
            <div className="text-sm">{payloadResumen(evento)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

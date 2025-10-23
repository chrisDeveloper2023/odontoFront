// src/components/ToothSidePanel.tsx
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import OdontoEventosTimeline from "@/components/odonto/OdontoEventosTimeline";
import {
  OdontoEventoDTO,
  Pieza,
  fetchEventosOdontograma,
  patchPiezaEstado,
  withDraftRetry,
} from "@/lib/api/odontograma";
import type { EstadoPieza } from "@/types/odontograma";

const ESTADO_OPTIONS: EstadoPieza[] = [
  "SANO",
  "AUSENTE",
  "FRACTURA",
  "OBTURADO",
  "CARIES",
  "EXTRACCION_INDICADA",
  "ENDODONCIA",
  "CORONA",
  "IMPLANTE",
  "PROTESIS_FIJA",
  "PROTESIS_REMOVIBLE",
  "MOVILIDAD",
];

export default function ToothSidePanel({
  pieza,
  idOdonto,
  historiaId,
  ensureDraft,
  onSaved,
  refreshKey,
}: {
  pieza?: Pieza;
  idOdonto: number;
  historiaId?: number;
  ensureDraft?: () => Promise<void>;
  onSaved?: () => void;
  refreshKey?: number;
}) {
  const [presente, setPresente] = useState<boolean>(pieza?.esta_presente !== false);
  const [estado, setEstado] = useState<string>(pieza?.estado_general ?? "SANO");
  const [notas, setNotas] = useState<string>(pieza?.notas ?? "");
  const [eventos, setEventos] = useState<OdontoEventoDTO[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(false);
  const fdi = pieza?.numero_fdi;

  useEffect(() => {
    setPresente(pieza?.esta_presente !== false);
    setEstado(pieza?.estado_general ?? "SANO");
    setNotas(pieza?.notas ?? "");
  }, [pieza]);

  const refreshEventos = useCallback(
    async (options?: { silent?: boolean; signal?: { cancelled: boolean } }) => {
      const signal = options?.signal;
      if (!historiaId || !fdi) {
        if (!signal?.cancelled) {
          setEventos([]);
          if (!options?.silent) setLoadingEventos(false);
        }
        return;
      }

      if (!options?.silent) setLoadingEventos(true);
      try {
        const { eventos } = await fetchEventosOdontograma(historiaId, { fdi, limit: 50 });
        if (!signal?.cancelled) {
          setEventos(eventos);
        }
      } catch (error) {
        if (!signal?.cancelled) {
          console.error("Error cargando eventos del odontograma:", error);
          setEventos([]);
        }
      } finally {
        if (!signal?.cancelled && !options?.silent) {
          setLoadingEventos(false);
        }
      }
    },
    [historiaId, fdi],
  );

  useEffect(() => {
    const tracker = { cancelled: false };
    if (!historiaId || !fdi) {
      setEventos([]);
      setLoadingEventos(false);
      return;
    }
    refreshEventos({ signal: tracker }).catch(() => undefined);
    return () => {
      tracker.cancelled = true;
    };
  }, [historiaId, fdi, refreshKey, refreshEventos]);

  if (!pieza) return null;

  const save = async () => {
    try {
      if (ensureDraft) {
        await withDraftRetry(
          () =>
            patchPiezaEstado({
              idOdontograma: idOdonto,
              fdi: pieza.numero_fdi,
              presente,
              estado,
              notas,
            }),
          ensureDraft,
        );
      } else {
        await patchPiezaEstado({
          idOdontograma: idOdonto,
          fdi: pieza.numero_fdi,
          presente,
          estado,
          notas,
        });
      }
      await refreshEventos();
      onSaved?.();
    } catch (e) {
      console.error("Error guardando pieza:", e);
    }
  };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-base">FDI {pieza.numero_fdi}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-sm w-24">Presente</label>
          <input type="checkbox" checked={presente} onChange={(e) => setPresente(e.target.checked)} />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm w-24">Estado</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            {ESTADO_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm">Notas</label>
          <Input value={notas} onChange={(e) => setNotas(e.target.value)} />
        </div>

        <div className="pt-2">
          <Button onClick={save} className="w-full">Guardar cambios</Button>
        </div>

        <div className="border-t pt-3">
          <div className="mb-2 text-sm font-medium">Historial de la pieza</div>
          {loadingEventos ? (
            <div className="text-xs text-muted-foreground">Cargando...</div>
          ) : (
            <OdontoEventosTimeline eventos={eventos} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

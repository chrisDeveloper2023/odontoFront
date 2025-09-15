// src/components/OdontogramaView.tsx
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ToothTile from "@/components/ToothTile";
import ToothSidePanel from "@/components/ToothSidePanel";
import FaucesView from "@/components/FaucesView";
import {
  OdontogramaResponse,
  Pieza,
  Superficie,
  superficiesPorFDI as mapSuperficiesPorFDI,
  withDraftRetry,
  patchPiezaEstado,
} from "@/lib/api/odontograma";

const filasPermanentes = {
  supDerecha: [18, 17, 16, 15, 14, 13, 12, 11],
  supIzquierda: [21, 22, 23, 24, 25, 26, 27, 28],
  infDerecha: [48, 47, 46, 45, 44, 43, 42, 41],
  infIzquierda: [31, 32, 33, 34, 35, 36, 37, 38],
};
const filasTemporales = {
  supDerecha: [55, 54, 53, 52, 51],
  supIzquierda: [61, 62, 63, 64, 65],
  infDerecha: [85, 84, 83, 82, 81],
  infIzquierda: [71, 72, 73, 74, 75],
};

export default function OdontogramaView({
  data,
  draftCtx,
  onReload,
}: {
  data: OdontogramaResponse;
  draftCtx?: { citaId?: string; historiaId?: number };
  onReload?: () => void;
}) {
  const [selectedFdi, setSelectedFdi] = useState<number | null>(null);

  const idOdonto = data?.odontograma?.id_odontograma ?? (data?.odontograma as any)?.id ?? 0;
  const idHistoriaNum = (data?.odontograma?.id_historia ?? (data?.odontograma as any)?.idHistoria) as
    | number
    | undefined;

  const piezasPorFDI = useMemo(() => {
    const m = new Map<number, Pieza>();
    data?.piezas?.forEach((p) => m.set(p.numero_fdi, p));
    return m;
  }, [data]);

  const superficiesPorFDI = useMemo(() => {
    if (!data) return new Map<number, Superficie[]>();
    return mapSuperficiesPorFDI(data.piezas, data.superficies);
  }, [data]);

  const ctx = useMemo(
    () => ({ citaId: draftCtx?.citaId, historiaId: draftCtx?.historiaId ?? idHistoriaNum }),
    [draftCtx?.citaId, draftCtx?.historiaId, idHistoriaNum]
  );

  const renderFila = (nums: number[]) => (
    <div className="grid grid-cols-8 gap-2">
      {nums.map((fdi) => (
        <ToothTile
          key={fdi}
          pieza={piezasPorFDI.get(fdi)}
          superfs={superficiesPorFDI.get(fdi) || []}
          idOdonto={idOdonto}
          draftCtx={ctx}
          onAfterChange={onReload}
          onSelect={setSelectedFdi}
        />
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dentición permanente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {renderFila(filasPermanentes.supDerecha)}
            {renderFila(filasPermanentes.supIzquierda)}
            <div className="h-1" />
            {renderFila(filasPermanentes.infDerecha)}
            {renderFila(filasPermanentes.infIzquierda)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dentición temporal (decidua)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {renderFila(filasTemporales.supDerecha)}
            {renderFila(filasTemporales.supIzquierda)}
            <div className="h-1" />
            {renderFila(filasTemporales.infDerecha)}
            {renderFila(filasTemporales.infIzquierda)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vista con fauces</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <FaucesView
              piezasPorFDI={piezasPorFDI}
              superficiesPorPieza={superficiesPorFDI}
              onSelect={setSelectedFdi}
              onDoubleTogglePresence={async (fdi) => {
                if (!idOdonto) return;
                const pieza = piezasPorFDI.get(fdi);
                const nuevoPresente = !(pieza?.esta_presente !== false);
                const nuevoEstado = nuevoPresente ? "SANO" : "AUSENTE";
                try {
                  await withDraftRetry(
                    () =>
                      patchPiezaEstado({
                        idOdontograma: idOdonto,
                        fdi,
                        presente: nuevoPresente,
                        estado: nuevoEstado,
                      }),
                    ctx
                  );
                  onReload?.();
                } catch (e) {
                  console.error("Error toggle presencia (fauces):", e);
                }
              }}
            />
          </CardContent>
        </Card>

        {data && (
          <div className="text-xs text-muted-foreground pt-2">
            Odontograma #{idOdonto || "—"} · Historia #{idHistoriaNum || "—"} {data.odontograma?.is_draft ? "· DRAFT" : ""}
          </div>
        )}
      </div>

      <div>
        <ToothSidePanel
          pieza={selectedFdi ? piezasPorFDI.get(selectedFdi) : undefined}
          idOdonto={idOdonto}
          draftCtx={ctx}
          onSaved={onReload}
        />
        {!selectedFdi && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Selecciona una pieza</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Clic sobre un diente para ver sus detalles, alternar presencia, cambiar estado y
              guardar.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


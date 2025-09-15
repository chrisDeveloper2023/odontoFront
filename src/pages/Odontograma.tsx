import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw } from "lucide-react";

import ToothTile from "@/components/ToothTile";
import FaucesView from "@/components/FaucesView";
import ToothSidePanel from "@/components/ToothSidePanel";
import DraftBanner from "@/components/DraftBanner";
import {
  abrirDraftOdontograma,
  getOdontogramaByHistoria,
  superficiesPorFDI as mapSuperficiesPorFDI,
  OdontogramaResponse,
  Pieza,
  Superficie,
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

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function OdontogramaPage() {
  const q = useQuery();
  const navigate = useNavigate();

  const [historiaId, setHistoriaId] = useState<string>(q.get("historia") || "");
  const [citaId, setCitaId] = useState<string>(q.get("cita") || "");
  const [view, setView] = useState<"tablero" | "fauces">("tablero");

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OdontogramaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedFdi, setSelectedFdi] = useState<number | null>(null);

  useEffect(() => {
    if (historiaId) void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargar() {
    if (!historiaId) return;
    setLoading(true);
    setError(null);
    try {
      const json = await getOdontogramaByHistoria(historiaId);
      setData(json);
      const sp = new URLSearchParams(window.location.search);
      sp.set("historia", historiaId);
      if (citaId) sp.set("cita", citaId);
      else sp.delete("cita");
      navigate({ search: sp.toString() }, { replace: true });
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  // IDs seguros
  const idOdonto = data?.odontograma?.id_odontograma ?? data?.odontograma?.id ?? 0;
  const idHistoriaNum = (() => {
    const fromOg = data?.odontograma?.id_historia ?? data?.odontograma?.idHistoria;
    const fromQuery = Number(historiaId) || 0;
    return fromOg ?? fromQuery;
  })();

  // Banner: visible si estás en consolidado y tienes cita+historia
  const isConsolidado = Boolean(
    data?.odontograma &&
      (data.odontograma.is_draft === false || (data.odontograma as any).isDraft === false)
  );
  const canOpenDraft = Boolean(citaId && idHistoriaNum);
  const showDraftBanner = isConsolidado && canOpenDraft;

  async function handleOpenDraft() {
    await abrirDraftOdontograma(idHistoriaNum);
    await cargar(); // refresca para que ya aparezca el DRAFT
  }

  // Índices
  const piezasPorFDI = useMemo(() => {
    const m = new Map<number, Pieza>();
    data?.piezas?.forEach((p) => m.set(p.numero_fdi, p));
    return m;
  }, [data]);

  const superficiesPorFDI = useMemo(() => {
    if (!data) return new Map<number, Superficie[]>();
    return mapSuperficiesPorFDI(data.piezas, data.superficies);
  }, [data]);

  const draftCtx = useMemo(
    () => ({ citaId: citaId || undefined, historiaId: idHistoriaNum || undefined }),
    [citaId, idHistoriaNum]
  );

  const renderFila = (nums: number[]) => (
    <div className="grid grid-cols-8 gap-2">
      {nums.map((fdi) => (
        <ToothTile
          key={fdi}
          pieza={piezasPorFDI.get(fdi)}
          superfs={superficiesPorFDI.get(fdi) || []}
          idOdonto={idOdonto}
          draftCtx={draftCtx}
          onAfterChange={cargar}
          onSelect={setSelectedFdi}
        />
      ))}
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Filtros */}
      <div className="flex items-end gap-2 flex-wrap">
        <div className="grow max-w-[220px]">
          <label className="text-xs text-muted-foreground">ID de Historia</label>
          <Input
            placeholder="Ej. 8"
            value={historiaId}
            onChange={(e) => setHistoriaId(e.target.value)}
          />
        </div>
        <div className="grow max-w-[220px]">
          <label className="text-xs text-muted-foreground">ID de Cita</label>
          <Input
            placeholder="Ej. 123"
            value={citaId}
            onChange={(e) => setCitaId(e.target.value)}
          />
        </div>
        <Button onClick={cargar} disabled={loading || !historiaId}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Cargar
        </Button>

        <div className="flex gap-2 ml-auto">
          <Button
            variant={view === "tablero" ? "default" : "outline"}
            onClick={() => setView("tablero")}
          >
            Tablero
          </Button>
          <Button
            variant={view === "fauces" ? "default" : "outline"}
            onClick={() => setView("fauces")}
          >
            Fauces
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6 text-red-700">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Columna principal */}
        <div className="space-y-4">
          {/* 🔶 Banner para abrir draft si estás viendo consolidado */}
          <DraftBanner visible={showDraftBanner} onOpenDraft={handleOpenDraft} />

          {view === "tablero" ? (
            <>
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
            </>
          ) : (
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
                        draftCtx
                      );
                      await cargar();
                    } catch (e) {
                      console.error("Error toggle presencia (fauces):", e);
                    }
                  }}
                />
              </CardContent>
            </Card>
          )}

          {data && (
            <div className="text-xs text-muted-foreground pt-2">
              Odontograma #{idOdonto || "—"} · Historia #{idHistoriaNum || "—"}{" "}
              {data.odontograma?.is_draft ? "· DRAFT" : ""}
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <div>
          <ToothSidePanel
            pieza={selectedFdi ? piezasPorFDI.get(selectedFdi) : undefined}
            idOdonto={idOdonto}
            draftCtx={draftCtx}
            onSaved={cargar}
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
    </div>
  );
}

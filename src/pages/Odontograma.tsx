import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw } from "lucide-react";
import DraftBanner from "@/components/DraftBanner";
import OdontogramaView from "@/components/OdontogramaView";
import {
  abrirDraftOdontograma,
  getOdontogramaByHistoria,
  OdontogramaResponse,
} from "@/lib/api/odontograma";

export default function OdontogramaPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const locationState = location.state as { historiaId?: number; citaId?: number | string } | undefined;

  const initialHistoria = searchParams.get("historia") ?? (locationState?.historiaId ? String(locationState.historiaId) : "");
  const initialCita = searchParams.get("cita") ?? (locationState?.citaId ? String(locationState.citaId) : "");

  const [historiaId, setHistoriaId] = useState<string>(initialHistoria);
  const [citaId, setCitaId] = useState<string>(initialCita);
  const [historiaInput, setHistoriaInput] = useState<string>(initialHistoria);
  const [citaInput, setCitaInput] = useState<string>(initialCita);
  const [view, setView] = useState<"tablero" | "fauces">("tablero");

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OdontogramaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const historiaIdNum = Number(historiaId) || 0;

  const cargar = useCallback(
    async (vigente = false) => {
      if (!historiaIdNum) return;
      setLoading(true);
      setError(null);
      try {
        const result = await getOdontogramaByHistoria(historiaIdNum, { vigente });
        setData(result);

        const params = new URLSearchParams(window.location.search);
        params.set("historia", String(historiaIdNum));
        if (citaId) params.set("cita", citaId);
        else params.delete("cita");
        navigate({ search: params.toString() }, { replace: true });
      } catch (err: any) {
        setError(err?.message || "No se pudo cargar el odontograma");
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [citaId, historiaIdNum, navigate],
  );

  useEffect(() => {
    if (historiaIdNum) {
      void cargar(false);
    }
  }, [historiaIdNum, cargar]);

  useEffect(() => {
    setHistoriaInput(historiaId);
  }, [historiaId]);

  useEffect(() => {
    setCitaInput(citaId);
  }, [citaId]);

  const ensureDraft = useCallback(async () => {
    if (!historiaIdNum) return;
    await abrirDraftOdontograma(historiaIdNum, "from_last");
    await cargar(false);
  }, [historiaIdNum, cargar]);

  const handleBuscar = () => {
    setHistoriaId(historiaInput.trim());
    setCitaId(citaInput.trim());
  };

  const handleRefresh = () => {
    void cargar(false);
  };

  const odontograma = data?.odontograma ?? null;
  const isDraft = Boolean(odontograma?.is_draft);
  const canOpenDraft = Boolean(historiaIdNum && !isDraft);
  const ensureDraftHandler = historiaIdNum ? ensureDraft : undefined;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Buscar odontograma</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[160px_160px_auto] md:items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium">Historia clínica ID</label>
            <Input
              value={historiaInput}
              onChange={(event) => setHistoriaInput(event.target.value)}
              placeholder="Ej. 19"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Cita ID (opcional)</label>
            <Input
              value={citaInput}
              onChange={(event) => setCitaInput(event.target.value)}
              placeholder="Ej. 42"
            />
          </div>
          <div className="flex gap-2 md:justify-end">
            <Button onClick={handleBuscar} disabled={!historiaInput.trim()}>
              Cargar
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={loading || !historiaIdNum}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              onClick={() => setView((prev) => (prev === "tablero" ? "fauces" : "tablero"))}
              disabled={!data}
            >
              {view === "tablero" ? "Vista fauces" : "Vista tablero"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {canOpenDraft && (
        <Card>
          <CardContent className="py-3 flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Estás viendo una versión consolidada. Para editar, abre un borrador.
            </div>
            <Button onClick={() => void ensureDraft()}>Abrir para editar</Button>
          </CardContent>
        </Card>
      )}

      <DraftBanner visible={isDraft} />

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando odontograma...
        </div>
      )}

      {data ? (
        <OdontogramaView
          data={data}
          ensureDraft={ensureDraftHandler}
          onReload={() => cargar(false)}
          mode={view}
        />
      ) : (
        !loading && (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Busca una historia clínica para visualizar su odontograma.
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}

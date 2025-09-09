import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";

// --- Types ---------------------------------------------------------------

type Pieza = {
  id_pieza: number;
  id_odontograma: number;
  numero_fdi: number;
  estado_general: "SANO" | "AUSENTE" | string;
  esta_presente: boolean;
  notas?: string | null;
};

type Superficie = {
  id_superficie: number;
  id_pieza: number;
  superficie:
  | "OCUSAL_INCISAL"
  | "MESIAL"
  | "DISTAL"
  | "VESTIBULAR_BUCAL"
  | "PALATINO_LINGUAL"
  | string;
  hallazgo?: string | null;
  detalle?: string | null;
  id_tratamiento_sugerido?: number | null;
  fdi?: number;
};

type OdontogramaResponse = {
  odontograma: { id: number; idHistoria: number };
  piezas: Pieza[];
  superficies: Superficie[];
};


// --- Mini SVG de diente con 5 superficies --------------------------------
type SurfaceCode =
  | "OCUSAL_INCISAL"
  | "MESIAL"
  | "DISTAL"
  | "VESTIBULAR_BUCAL"
  | "PALATINO_LINGUAL";

function DentalToothSVG({
  size = 64,
  present = true,
  surfaces,
  onToggleSurface,
}: {
  size?: number;
  present?: boolean;
  surfaces: Partial<Record<SurfaceCode, boolean>>; // true = hay hallazgo
  onToggleSurface?: (s: SurfaceCode) => void;
}) {
  const s = size;
  const g = s / 3; // grilla 3x3
  const stroke = 1.5;

  const cell = (x: number, y: number, code: SurfaceCode) => {
    const active = !!surfaces[code];
    return (
      <rect
        key={code}
        x={x}
        y={y}
        width={g}
        height={g}
        rx={4}
        ry={4}
        className={active ? "fill-amber-300" : "fill-white"}
        stroke="currentColor"
        strokeWidth={stroke}
        onClick={() => onToggleSurface?.(code)}
        style={{ cursor: "pointer" }}
      />
    );
  };

  // Layout (vista simplificada):
  // [MESIAL][OCUSAL_INCISAL][DISTAL]
  // [VESTIBULAR_BUCAL]   (vacío)   [PALATINO_LINGUAL]

  if (!present) {
    // pieza ausente: muestra cruz
    return (
      <svg width={s} height={s} className="text-red-500">
        <rect x={0} y={0} width={s} height={s} rx={10} ry={10} className="fill-red-50" />
        <line x1={6} y1={6} x2={s - 6} y2={s - 6} stroke="currentColor" strokeWidth={3} />
        <line x1={s - 6} y1={6} x2={6} y2={s - 6} stroke="currentColor" strokeWidth={3} />
      </svg>
    );
  }

  return (
    <svg width={s} height={s} className="text-slate-500">
      <rect x={0} y={0} width={s} height={s} rx={10} ry={10} className="fill-slate-50" />
      {cell(0, 0, "MESIAL")}
      {cell(g, 0, "OCUSAL_INCISAL")}
      {cell(2 * g, 0, "DISTAL")}
      {cell(0, g, "VESTIBULAR_BUCAL")}
      {cell(2 * g, g, "PALATINO_LINGUAL")}
    </svg>
  );
}

// --- Helpers -------------------------------------------------------------

// Usa VITE_API_URL si existe; si no, cae al proxy /api (Vite).
const API_BASE = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function ordenarFila(nums: number[]) {
  // Orden de derecha a izquierda como se ve en un odontograma
  return [...nums].sort((a, b) => b - a);
}

const filasPermanentes = {
  supDerecha: ordenarFila([11, 12, 13, 14, 15, 16, 17, 18]),
  supIzquierda: [21, 22, 23, 24, 25, 26, 27, 28],
  infDerecha: ordenarFila([41, 42, 43, 44, 45, 46, 47, 48]),
  infIzquierda: [31, 32, 33, 34, 35, 36, 37, 38],
};

const filasTemporales = {
  supDerecha: ordenarFila([51, 52, 53, 54, 55]),
  supIzquierda: [61, 62, 63, 64, 65],
  infDerecha: ordenarFila([81, 82, 83, 84, 85]),
  infIzquierda: [71, 72, 73, 74, 75],
};

function colorEstado(estado?: string, presente?: boolean) {
  if (presente === false || estado === "AUSENTE") return "bg-red-100 text-red-700 border-red-300";
  if (estado === "SANO") return "bg-emerald-100 text-emerald-700 border-emerald-300";
  return "bg-amber-100 text-amber-700 border-amber-300"; // cualquier otro estado
}

// --- UI de una pieza -----------------------------------------------------

function ToothTile({ pieza, superfs }: { pieza?: Pieza; superfs: Superficie[] }) {
  const etiqueta = pieza?.numero_fdi ?? "?";
  const estado = pieza?.estado_general;
  const presente = pieza?.esta_presente !== false; // por defecto presente

  // Mapear superficies -> boolean (hay hallazgo) para iniciar el estado local
  const initial = useMemo(() => {
    const m: Partial<Record<SurfaceCode, boolean>> = {};
    for (const s of superfs) {
      if (!s?.superficie) continue;
      const code = s.superficie as SurfaceCode;
      const activo = !!(s.hallazgo && String(s.hallazgo).trim() !== "");
      m[code] = m[code] || activo;
    }
    return m;
  }, [superfs]);

  const [activeSurfaces, setActiveSurfaces] =
    useState<Partial<Record<SurfaceCode, boolean>>>(initial);

  useEffect(() => setActiveSurfaces(initial), [initial]);

  const toggleSurface = (code: SurfaceCode) => {
    setActiveSurfaces((prev) => ({ ...prev, [code]: !prev[code] }));
    // Aquí luego haremos PATCH para persistir en BD
  };

  const clasesColor =
    !presente || estado === "AUSENTE"
      ? "bg-red-100 text-red-700 border-red-300"
      : estado === "SANO"
        ? "bg-emerald-100 text-emerald-700 border-emerald-300"
        : "bg-amber-100 text-amber-700 border-amber-300";

  const hallCount = Object.values(activeSurfaces).filter(Boolean).length;

  return (
    <div
      className={`border rounded-xl p-2 text-center text-sm shadow-sm ${clasesColor} flex flex-col items-center justify-between min-h-[120px]`}
      title={pieza?.notas || ""}
    >
      <div className="text-xs opacity-70">FDI</div>
      <div className="text-xl font-semibold leading-none">{etiqueta}</div>

      {/* SVG interactivo */}
      <div className="my-2">
        <DentalToothSVG
          present={presente}
          surfaces={activeSurfaces}
          onToggleSurface={toggleSurface}
          size={70}
        />
      </div>

      <div className="mt-1">
        {estado && <Badge variant="secondary" className="text-[10px]">{estado}</Badge>}
        {!estado && <span className="text-[10px] opacity-60">sin datos</span>}
        {hallCount > 0 && <span className="ml-2 text-[10px]">· {hallCount} hallazgos</span>}
      </div>
    </div>
  );
}


// --- Página --------------------------------------------------------------

export default function OdontogramPage() {
  const q = useQuery();
  const navigate = useNavigate();

  const [historiaId, setHistoriaId] = useState<string>(q.get("historia") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OdontogramaResponse | null>(null);
  const [showTemporales, setShowTemporales] = useState(false);

  // Para diagnóstico: ver qué URLs probamos y qué devolvieron
  const [attempts, setAttempts] = useState<
    { url: string; status?: number; ok: boolean; err?: string }[]
  >([]);

  useEffect(() => {
    if (historiaId) void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchFirstOk(urls: string[]) {
    setAttempts([]);
    for (const url of urls) {
      try {
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        setAttempts((prev) => [...prev, { url, status: res.status, ok: res.ok }]);
        if (res.ok) return await res.json();
      } catch (e: any) {
        setAttempts((prev) => [...prev, { url, ok: false, err: String(e?.message ?? e) }]);
      }
    }
    throw new Error("No se pudo obtener el odontograma");
  }

  async function cargar() {
    if (!historiaId) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      // Posibles rutas (sin prefijo /api; lo añade API_BASE si aplica)
      const PATHS = [
        `/odontogramas/historia/${historiaId}`,
        `/odontograma/historia/${historiaId}`,
        `/odontogramas/${historiaId}`,
        `/odontograma/${historiaId}`,
        `/historias/${historiaId}/odontograma`,
        `/historia/${historiaId}/odontograma`,
      ];

      // Probar con base ("/api" o VITE_API_URL) y también en raíz
      const BASES = Array.from(new Set([API_BASE, ""]));
      const urls = BASES.flatMap((b) => PATHS.map((p) => `${b}${p}`));

      const json = (await fetchFirstOk(urls)) as OdontogramaResponse;
      setData(json);

      // Mantener ?historia= en la URL
      const sp = new URLSearchParams(location.search);
      sp.set("historia", historiaId);
      navigate({ search: sp.toString() }, { replace: true });
    } catch (e: any) {
      setError(e?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  // Índices por FDI para lookup rápido
  const piezasPorFDI = useMemo(() => {
    const map = new Map<number, Pieza>();
    data?.piezas?.forEach((p) => map.set(p.numero_fdi, p));
    return map;
  }, [data]);

  const superficiesPorPieza = useMemo(() => {
    const map = new Map<number, Superficie[]>();
    data?.superficies?.forEach((s) => {
      const key = s.fdi || s.id_pieza || 0;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return map;
  }, [data]);

  function renderFila(numeros: number[]) {
    return (
      <div className="grid grid-cols-8 gap-2">
        {numeros.map((n) => (
          <ToothTile key={n} pieza={piezasPorFDI.get(n)} superfs={superficiesPorPieza.get(n) || []} />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-end gap-2 flex-wrap">
        <div className="grow max-w-[280px]">
          <label className="text-xs text-muted-foreground">ID de Historia</label>
          <Input
            placeholder="Ej. 8"
            value={historiaId}
            onChange={(e) => setHistoriaId(e.target.value)}
          />
        </div>
        <Button onClick={cargar} disabled={loading || !historiaId}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Cargar
        </Button>
      </div>

      {error && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6 text-red-700">{error}</CardContent>
        </Card>
      )}

      {/* Panel diagnóstico: últimos intentos de URL */}
      {attempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Diagnóstico de rutas probadas</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            {attempts.map((a, i) => (
              <div key={i} className={a.ok ? "text-emerald-700" : "text-amber-700"}>
                {a.url} → {a.status ?? "ERR"} {a.err ? `· ${a.err}` : ""}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
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
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">
              Dentición temporal (decidua)
              <Button variant="secondary" size="sm" className="ml-2" onClick={() => setShowTemporales((v) => !v)}>
                {showTemporales ? "Ocultar" : "Mostrar"}
              </Button>
            </CardTitle>
          </CardHeader>
          {showTemporales && (
            <CardContent className="space-y-3">
              {renderFila(filasTemporales.supDerecha)}
              {renderFila(filasTemporales.supIzquierda)}
              <div className="h-1" />
              {renderFila(filasTemporales.infDerecha)}
              {renderFila(filasTemporales.infIzquierda)}
            </CardContent>
          )}
        </Card>
      </div>

      {data && (
        <div className="text-xs text-muted-foreground pt-2">
          Odontograma #{data.odontograma?.id} · Historia #{data.odontograma?.idHistoria}
        </div>
      )}
    </div>
  );
}

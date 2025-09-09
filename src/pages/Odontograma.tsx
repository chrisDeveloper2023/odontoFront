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

// --- Helpers -------------------------------------------------------------

// Base: usa VITE_API_URL si existe; si no, cae a "/api" (proxy de Vite).
const API_BASE = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function ordenarFila(nums: number[]) {
  // Devuelve los números ordenados de derecha a izquierda como se ve en un odontograma
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

// --- Mini SVG de diente con 5 superficies (interactivo) ------------------

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

// --- UI de una pieza (Tile) ----------------------------------------------

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
    // TODO: aquí luego haremos PATCH para persistir en BD
  };

  const clasesColor = colorEstado(estado, presente);
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

// --- Vista Fauces (arcos dentales con orofaringe) -------------------------

function FaucesView({
  piezasPorFDI,
  superficiesPorPieza,
  onSelect,
}: {
  piezasPorFDI: Map<number, Pieza>;
  superficiesPorPieza: Map<number, Superficie[]>;
  onSelect?: (fdi: number) => void;
}) {
  const arcoSuperior = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
  const arcoInferior = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

  // --- Geometría con "aire" extra ---
  const W = 900, H = 600;
  const P = 48;                 // 👈 padding del viewBox
  const cx = W / 2;
  const cySup = 260;            // antes 230
  const cyInf = 400;            // antes 370
  const Rsup = 280;             // antes 300
  const Rinf = 280;             // antes 300

  const toXY = (r: number, angleDeg: number, cy: number) => {
    const rad = (Math.PI / 180) * angleDeg;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const angles = (start: number, end: number, n: number) => {
    const step = (end - start) / (n - 1);
    return Array.from({ length: n }, (_, i) => start + i * step);
  };

  const angSup = angles(-160, -20, arcoSuperior.length);
  const angInf = angles(200, 340, arcoInferior.length);

  const classByEstado = (p?: Pieza) => {
    if (!p) return "fill-slate-100 stroke-slate-400";
    if (p.esta_presente === false || p.estado_general === "AUSENTE")
      return "fill-red-200 stroke-red-600";
    if (p.estado_general === "SANO")
      return "fill-emerald-200 stroke-emerald-600";
    return "fill-amber-200 stroke-amber-600";
  };

  const hallCount = (fdi: number) =>
    (superficiesPorPieza.get(fdi) || []).filter(
      (s) => s.hallazgo && String(s.hallazgo).trim() !== ""
    ).length;

  const FaucesBackground = () => (
    <g opacity={0.18}>
      <ellipse cx={cx} cy={cySup + 10} rx={180} ry={40} className="fill-purple-700" />
      <ellipse cx={cx} cy={cySup + 55} rx={14} ry={24} className="fill-purple-900" />
      <path
        d={`M ${cx-260},${cyInf-30} Q ${cx},${cyInf+80} ${cx+260},${cyInf-30} L ${cx+260},${cyInf+10} Q ${cx},${cyInf+120} ${cx-260},${cyInf+10} Z`}
        className="fill-rose-400"
      />
    </g>
  );

  const Tooth = ({ fdi, x, y }: { fdi: number; x: number; y: number }) => {
    const pieza = piezasPorFDI.get(fdi);
    const klass = classByEstado(pieza);
    const w = 34, h = 44, r = 8;

    return (
      <g
        transform={`translate(${x - w / 2}, ${y - h / 2})`}
        onClick={() => onSelect?.(fdi)}
        style={{ cursor: "pointer" }}
      >
        <rect width={w} height={h} rx={r} ry={r} className={klass} strokeWidth={1.8} />
        <text x={w / 2} y={h / 2 + 4} textAnchor="middle" className="fill-slate-800" fontSize={14} fontWeight={700}>
          {fdi}
        </text>
        {hallCount(fdi) > 0 && (
          <g transform={`translate(${w - 12}, -6)`}>
            <circle r={10} className="fill-amber-500" />
            <text x={0} y={4} textAnchor="middle" className="fill-white" fontSize={11} fontWeight={800}>
              {hallCount(fdi)}
            </text>
          </g>
        )}
        <title>{`FDI ${fdi} · ${pieza?.estado_general ?? "sin datos"}${pieza?.esta_presente===false?" (ausente)":""}`}</title>
      </g>
    );
  };

  return (
    <svg
      viewBox={`${-P} ${-P} ${W + 2 * P} ${H + 2 * P}`}  // 👈 viewBox con padding
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-auto overflow-visible"          // 👈 evita recortes por CSS
    >
      <FaucesBackground />

      {/* Arcos guía */}
      <path
        d={`M ${cx - Rsup},${cySup} A ${Rsup},${Rsup} 0 0 1 ${cx + Rsup},${cySup}`}
        className="fill-none stroke-slate-300"
        strokeDasharray="6 8"
      />
      <path
        d={`M ${cx - Rinf},${cyInf} A ${Rinf},${Rinf} 0 0 0 ${cx + Rinf},${cyInf}`}
        className="fill-none stroke-slate-300"
        strokeDasharray="6 8"
      />

      {/* Dientes superiores */}
      {arcoSuperior.map((fdi, i) => {
        const { x, y } = toXY(Rsup, angSup[i], cySup);
        return <Tooth key={fdi} fdi={fdi} x={x} y={y} />;
      })}

      {/* Dientes inferiores */}
      {arcoInferior.map((fdi, i) => {
        const { x, y } = toXY(Rinf, angInf[i], cyInf);
        return <Tooth key={fdi} fdi={fdi} x={x} y={y} />;
      })}
    </svg>
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

  // Toggle de vistas
  const [view, setView] = useState<"tablero" | "fauces">("tablero");
  const [selectedFdi, setSelectedFdi] = useState<number | null>(null);

  // Para diagnóstico: ver qué URLs probamos y qué devolvieron
  const [attempts, setAttempts] = useState<
    { url: string; status?: number; ok: boolean; err?: string }[]
  >([]);

  useEffect(() => {
    // Si viene ?historia= en la URL, disparar carga inicial
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
      // PRIORIDAD: ya vimos que /historias/:id/odontograma devuelve 200
      const PATHS = [
        `/historias/${historiaId}/odontograma`,
        `/historia/${historiaId}/odontograma`,
        `/odontogramas/historia/${historiaId}`,
        `/odontograma/historia/${historiaId}`,
        `/odontogramas/${historiaId}`,
        `/odontograma/${historiaId}`,
      ];
      // Probar con base ("/api" o VITE_API_URL) y también en raíz
      const BASES = Array.from(new Set([API_BASE, ""]));
      const urls = BASES.flatMap((b) => PATHS.map((p) => `${b}${p}`));

      const json = (await fetchFirstOk(urls)) as OdontogramaResponse;
      setData(json);

      // Mantener ?historia= en la URL
      const sp = new URLSearchParams(window.location.search);
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

        {/* Toggle de vistas */}
        <div className="flex gap-2 ml-auto">
          <Button variant={view === "tablero" ? "default" : "outline"} onClick={() => setView("tablero")}>
            Tablero
          </Button>
          <Button variant={view === "fauces" ? "default" : "outline"} onClick={() => setView("fauces")}>
            Fauces
          </Button>
        </div>
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

      {view === "tablero" ? (
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
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Vista con fauces {selectedFdi ? `· Seleccionado FDI ${selectedFdi}` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <FaucesView
              piezasPorFDI={piezasPorFDI}
              superficiesPorPieza={superficiesPorPieza}
              onSelect={(fdi) => setSelectedFdi(fdi)}
            />
          </CardContent>
        </Card>
      )}

      {data && (
        <div className="text-xs text-muted-foreground pt-2">
          Odontograma #{data.odontograma?.id} · Historia #{data.odontograma?.idHistoria}
        </div>
      )}
    </div>
  );
}

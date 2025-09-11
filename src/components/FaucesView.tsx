// src/components/FaucesView.tsx
import { Pieza, Superficie } from "@/lib/api/odontograma";

export default function FaucesView({
  piezasPorFDI,
  superficiesPorPieza,
  onSelect,
  onDoubleTogglePresence,
}: {
  piezasPorFDI: Map<number, Pieza>;
  superficiesPorPieza: Map<number, Superficie[]>;
  onSelect?: (fdi: number) => void;
  onDoubleTogglePresence?: (fdi: number) => void;
}) {
  const arcoSuperior = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
  const arcoInferior = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

  const W = 900, H = 600;
  const P = 48;
  const cx = W / 2;
  const cySup = 260;
  const cyInf = 400;
  const Rsup = 280;
  const Rinf = 280;

  const toXY = (r: number, angle: number, cy: number) => {
    const rad = (Math.PI / 180) * angle;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const angles = (start: number, end: number, n: number) =>
    Array.from({ length: n }, (_, i) => start + (end - start) * (i / (n - 1)));

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

  const Tooth = ({ fdi, x, y }: { fdi: number; x: number; y: number }) => {
    const pieza = piezasPorFDI.get(fdi);
    const klass = classByEstado(pieza);
    const w = 34, h = 44, r = 8;

    const dbl = (e: React.MouseEvent<SVGGElement>) => {
      e.stopPropagation();
      onDoubleTogglePresence?.(fdi);
    };

    return (
      <g
        transform={`translate(${x - w / 2}, ${y - h / 2})`}
        onClick={() => onSelect?.(fdi)}
        onDoubleClick={dbl}
        style={{ cursor: "pointer" }}
      >
        <title>{`Doble clic: ausente/presente · FDI ${fdi}`}</title>
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
      </g>
    );
  };

  return (
    <svg
      viewBox={`${-P} ${-P} ${W + 2 * P} ${H + 2 * P}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-auto overflow-visible"
    >
      {/* arcos guía */}
      <path d={`M ${cx - Rsup},${cySup} A ${Rsup},${Rsup} 0 0 1 ${cx + Rsup},${cySup}`} className="fill-none stroke-slate-300" strokeDasharray="6 8" />
      <path d={`M ${cx - Rinf},${cyInf} A ${Rinf},${Rinf} 0 0 0 ${cx + Rinf},${cyInf}`} className="fill-none stroke-slate-300" strokeDasharray="6 8" />

      {arcoSuperior.map((fdi, i) => {
        const { x, y } = toXY(Rsup, angSup[i], cySup);
        return <Tooth key={fdi} fdi={fdi} x={x} y={y} />;
      })}
      {arcoInferior.map((fdi, i) => {
        const { x, y } = toXY(Rinf, angInf[i], cyInf);
        return <Tooth key={fdi} fdi={fdi} x={x} y={y} />;
      })}
    </svg>
  );
}

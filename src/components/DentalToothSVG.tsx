// src/components/DentalToothSVG.tsx
import React from "react";
import { SuperficieCode } from "@/lib/api/odontograma";

export default function DentalToothSVG({
  size = 64,
  present = true,
  surfaces,
  onToggleSurface,
  onPieceDoubleClick,
}: {
  size?: number;
  present?: boolean;
  surfaces: Partial<Record<SuperficieCode, boolean>>;
  onToggleSurface?: (s: SuperficieCode) => void;
  onPieceDoubleClick?: () => void;
}) {
  const s = size;
  const g = s / 3;
  const stroke = 1.5;

  const handlePieceDbl = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    onPieceDoubleClick?.();
  };

  const cell = (x: number, y: number, code: SuperficieCode) => {
    const active = !!surfaces[code];
    const handleClick = (e: React.MouseEvent<SVGRectElement>) => {
      e.stopPropagation();
      onToggleSurface?.(code);
    };
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
        onClick={handleClick}
        style={{ cursor: "pointer" }}
      />
    );
  };

  if (!present) {
    return (
      <svg width={s} height={s} className="text-red-500" onDoubleClick={handlePieceDbl}>
        <title>Doble clic: alternar ausente/presente</title>
        <rect x={0} y={0} width={s} height={s} rx={10} ry={10} className="fill-red-50" />
        <line x1={6} y1={6} x2={s - 6} y2={s - 6} stroke="currentColor" strokeWidth={3} />
        <line x1={s - 6} y1={6} x2={6} y2={s - 6} stroke="currentColor" strokeWidth={3} />
      </svg>
    );
  }

  return (
    <svg width={s} height={s} className="text-slate-500" onDoubleClick={handlePieceDbl}>
      <title>Doble clic: alternar ausente/presente</title>
      <rect x={0} y={0} width={s} height={s} rx={10} ry={10} className="fill-slate-50" />
      {cell(0, 0, "MESIAL")}
      {cell(g, 0, "OCUSAL_INCISAL")}
      {cell(2 * g, 0, "DISTAL")}
      {cell(0, g, "VESTIBULAR_BUCAL")}
      {cell(2 * g, g, "PALATINO_LINGUAL")}
    </svg>
  );
}

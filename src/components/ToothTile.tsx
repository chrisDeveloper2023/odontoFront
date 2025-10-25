// src/components/ToothTile.tsx
import { useEffect, useMemo, useState } from "react";
import DentalToothSVG from "@/components/DentalToothSVG";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Pieza,
  Superficie,
  SuperficieCode,
  patchPiezaEstado,
  patchSuperficie,
  withDraftRetry,
} from "@/lib/api/odontograma";

function colorEstado(estado?: string, presente?: boolean) {
  if (presente === false || estado === "AUSENTE") return "bg-red-100 text-red-700 border-red-300";
  if (estado === "SANO") return "bg-emerald-100 text-emerald-700 border-emerald-300";
  return "bg-amber-100 text-amber-700 border-amber-300";
}

export default function ToothTile({
  pieza,
  superfs,
  idOdonto,
  ensureDraft,
  onAfterChange,
  onSelect,
}: {
  pieza?: Pieza;
  superfs: Superficie[];
  idOdonto: number;
  ensureDraft?: () => Promise<void>;
  onAfterChange?: () => void;
  onSelect?: (fdi: number) => void;
}) {
  const fdi = pieza?.numero_fdi ?? 0;
  const etiqueta = fdi || "?";
  const estado = pieza?.estado_general;
  const presente = pieza?.esta_presente !== false;

  // Estado local optimista
  const [presentShown, setPresentShown] = useState<boolean>(presente);
  const [estadoShown, setEstadoShown] = useState<string | undefined>(estado);

  useEffect(() => {
    setPresentShown(presente);
    setEstadoShown(estado);
  }, [presente, estado]);

  // Mapear superficies -> boolean
  const initial = useMemo(() => {
    const m: Partial<Record<SuperficieCode, boolean>> = {};
    for (const s of superfs) {
      const code = s.superficie as SuperficieCode;
      const activo = !!(s.hallazgo && String(s.hallazgo).trim() !== "");
      m[code] = m[code] || activo;
    }
    return m;
  }, [superfs]);

  const [activeSurfaces, setActiveSurfaces] =
    useState<Partial<Record<SuperficieCode, boolean>>>(initial);

  useEffect(() => setActiveSurfaces(initial), [initial]);

  const toggleSurface = async (code: SuperficieCode) => {
    const nextVal = !activeSurfaces[code];
    setActiveSurfaces((prev) => ({ ...prev, [code]: nextVal }));
    try {
      if (ensureDraft) {
        await withDraftRetry(
          () =>
            patchSuperficie({
              idOdontograma: idOdonto,
              fdi: fdi || Number(etiqueta),
              superficie: code,
              hallazgo: nextVal ? "CARIES" : null,
              detalle: nextVal ? "Marcado desde UI" : null,
            }),
          ensureDraft,
        );
      } else {
        await patchSuperficie({
          idOdontograma: idOdonto,
          fdi: fdi || Number(etiqueta),
          superficie: code,
          hallazgo: nextVal ? "CARIES" : null,
          detalle: nextVal ? "Marcado desde UI" : null,
        });
      }
      onAfterChange?.();
      toast.success(`Superficie ${code.replace(/_/g, " ")} actualizada`);
    } catch (e) {
      setActiveSurfaces((prev) => ({ ...prev, [code]: !nextVal }));
      console.error("Error al guardar superficie:", e);
      toast.error("No se pudo actualizar la superficie");
    }
  };

  const togglePresencia = async () => {
    const nuevoPresente = !presentShown;
    const nuevoEstado = nuevoPresente ? "SANO" : "AUSENTE";
    setPresentShown(nuevoPresente);
    setEstadoShown(nuevoEstado);
    if (!nuevoPresente) setActiveSurfaces({});
    try {
      if (ensureDraft) {
        await withDraftRetry(
          () =>
            patchPiezaEstado({
              idOdontograma: idOdonto,
              fdi: fdi || Number(etiqueta),
              presente: nuevoPresente,
              estado: nuevoEstado,
            }),
          ensureDraft,
        );
      } else {
        await patchPiezaEstado({
          idOdontograma: idOdonto,
          fdi: fdi || Number(etiqueta),
          presente: nuevoPresente,
          estado: nuevoEstado,
        });
      }
      onAfterChange?.();
      toast.success(`Presencia de la pieza ${etiqueta} actualizada`);
    } catch (e) {
      setPresentShown(!nuevoPresente);
      setEstadoShown(presentShown ? "SANO" : "AUSENTE");
      console.error("Error al cambiar presencia:", e);
      toast.error("No se pudo actualizar la pieza");
    }
  };

  const clasesColor = colorEstado(estadoShown, presentShown);
  const hallCount = Object.values(activeSurfaces).filter(Boolean).length;

  return (
    <div
      className={`border rounded-xl p-2 text-center text-sm shadow-sm ${clasesColor} flex flex-col items-center justify-between min-h-[120px]`}
      title={pieza?.notas || ""}
      onClick={() => fdi && onSelect?.(fdi)}
    >
      <div className="text-xs opacity-70">FDI</div>
      <div className="text-xl font-semibold leading-none select-none">{etiqueta}</div>

      <div className="my-2">
        <DentalToothSVG
          present={presentShown}
          surfaces={activeSurfaces}
          onToggleSurface={toggleSurface}
          onPieceDoubleClick={togglePresencia}
          size={70}
        />
      </div>

      <div className="mt-1">
        {estadoShown && <Badge variant="secondary" className="text-[10px]">{estadoShown}</Badge>}
        {!estadoShown && <span className="text-[10px] opacity-60">sin datos</span>}
        {hallCount > 0 && <span className="ml-2 text-[10px]">· {hallCount} hallazgos</span>}
      </div>
    </div>
  );
}

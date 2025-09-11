// src/components/ToothSidePanel.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pieza, patchPiezaEstado, withDraftRetry } from "@/lib/api/odontograma";

export default function ToothSidePanel({
  pieza,
  idOdonto,
  draftCtx,
  onSaved,
}: {
  pieza?: Pieza;
  idOdonto: number;
  draftCtx?: { citaId?: string; historiaId?: number };
  onSaved?: () => void;
}) {
  const [presente, setPresente] = useState<boolean>(pieza?.esta_presente !== false);
  const [estado, setEstado] = useState<string>(pieza?.estado_general ?? "SANO");
  const [notas, setNotas] = useState<string>(pieza?.notas ?? "");

  useEffect(() => {
    setPresente(pieza?.esta_presente !== false);
    setEstado(pieza?.estado_general ?? "SANO");
    setNotas(pieza?.notas ?? "");
  }, [pieza]);

  if (!pieza) return null;

  const save = async () => {
    try {
      await withDraftRetry(
        () =>
          patchPiezaEstado({
            idOdontograma: idOdonto,
            fdi: pieza.numero_fdi,
            presente,
            estado,
            notas,
          }),
        draftCtx
      );
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
          <select className="border rounded px-2 py-1 text-sm"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}>
            <option value="SANO">SANO</option>
            <option value="AUSENTE">AUSENTE</option>
            <option value="FRACTURA">FRACTURA</option>
            <option value="OBTURACION">OBTURACIÓN</option>
          </select>
        </div>

        <div>
          <label className="text-sm">Notas</label>
          <Input value={notas} onChange={(e) => setNotas(e.target.value)} />
        </div>

        <div className="pt-2">
          <Button onClick={save} className="w-full">Guardar cambios</Button>
        </div>
      </CardContent>
    </Card>
  );
}

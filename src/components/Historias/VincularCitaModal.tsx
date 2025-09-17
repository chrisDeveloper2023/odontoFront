// src/components/Historias/VincularCitaModal.tsx
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiGet, apiPost } from "@/api/client";

type Cita = { id_cita: number; fecha_hora?: string; estado?: string } & Record<string, any>;

export default function VincularCitaModal({
  open,
  onOpenChange,
  idPaciente,
  idHistoria,
  onLinked,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  idPaciente: number;
  idHistoria: number;
  onLinked?: (idCita: number) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    apiGet<Cita[]>(`/pacientes/${idPaciente}/citas-disponibles`)
      .then((rows) => setCitas(Array.isArray(rows) ? rows : []))
      .catch((e: any) => setError(e?.message || "Error al cargar citas disponibles"))
      .finally(() => setLoading(false));
  }, [open, idPaciente]);

  const link = async () => {
    if (!selected) return;
    const idCita = Number(selected);
    setLoading(true);
    setError(null);
    try {
      await apiPost(`/historias-clinicas/${idHistoria}/relacionar-cita`, { id_cita: idCita });
      onLinked?.(idCita);
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.message || "No se pudo vincular la cita");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Vincular a una cita</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="space-y-1">
            <label className="text-sm">Cita disponible</label>
            <Select value={selected} onValueChange={(v) => setSelected(v)} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Cargando…" : "Selecciona una cita"} />
              </SelectTrigger>
              <SelectContent>
                {citas.map((c) => (
                  <SelectItem key={c.id_cita} value={String(c.id_cita)}>
                    #{c.id_cita} · {c.estado || ""} · {c.fecha_hora || "—"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
            <Button onClick={link} disabled={loading || !selected}>Vincular</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


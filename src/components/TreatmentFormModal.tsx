import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Treatment, TreatmentPayload } from "@/types/treatment";

type ClinicOption = {
  id: number;
  nombre: string;
};

type PieceOption = {
  id: number;
  numero_fdi?: number | null;
  label: string;
};

interface TreatmentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: TreatmentPayload) => Promise<void> | void;
  loading?: boolean;
  initialData?: Treatment | null;
  clinics?: ClinicOption[];
  historiaId: number;
  historiaLabel?: string;
  piezaOptions?: PieceOption[];
}

const makeEmptyForm = (historiaId: number): TreatmentPayload => ({
  nombre: "",
  descripcion: "",
  costo_base: 0,
  id_historia: historiaId,
  id_clinica: null,
  id_pieza: null,
  facturado: false,
  pagado: false,
});

const NO_VALUE = "none";

export default function TreatmentFormModal({
  open,
  onClose,
  onSubmit,
  loading = false,
  initialData,
  clinics,
  historiaId,
  historiaLabel,
  piezaOptions,
}: TreatmentFormModalProps) {
  const [form, setForm] = useState<TreatmentPayload>(makeEmptyForm(historiaId));

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          nombre: initialData.nombre,
          descripcion: initialData.descripcion ?? "",
          costo_base: initialData.costo_base ?? 0,
          id_historia: initialData.id_historia ?? historiaId,
          id_clinica: initialData.id_clinica ?? null,
          id_pieza: initialData.id_pieza ?? null,
          facturado: Boolean(initialData.facturado),
          pagado: Boolean(initialData.pagado),
        });
      } else {
        setForm(makeEmptyForm(historiaId));
      }
    }
  }, [open, initialData, historiaId]);

  const pieceLabelById = useMemo(() => {
    if (!piezaOptions) return new Map<number, string>();
    return new Map(piezaOptions.map((option) => [option.id, option.label]));
  }, [piezaOptions]);

  const pieceHint = useMemo(() => {
    if (!form.id_pieza) return null;
    return pieceLabelById.get(form.id_pieza) ?? null;
  }, [form.id_pieza, pieceLabelById]);

  const handleChange = (field: keyof TreatmentPayload, value: string | number | boolean | null) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.nombre.trim()) return;
    const payload: TreatmentPayload = {
      ...form,
      id_historia: historiaId,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion?.trim() || "",
      costo_base: Number(form.costo_base || 0),
      id_clinica: form.id_clinica ?? null,
      id_pieza: form.id_pieza ?? null,
      facturado: Boolean(form.facturado),
      pagado: Boolean(form.pagado),
    };
    await onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !loading && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="space-y-1">
          <DialogTitle>{initialData ? "Editar tratamiento" : "Nuevo tratamiento"}</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Historia clínica #{historiaLabel ?? historiaId}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={form.nombre}
              onChange={(event) => handleChange("nombre", event.target.value)}
              placeholder="Ej. Profilaxis dental"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={form.descripcion ?? ""}
              onChange={(event) => handleChange("descripcion", event.target.value)}
              rows={3}
              placeholder="Detalle del procedimiento realizado"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="costo_base">Costo base</Label>
              <Input
                id="costo_base"
                type="number"
                step="0.01"
                min="0"
                value={form.costo_base ?? 0}
                onChange={(event) => handleChange("costo_base", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="id_clinica">Clínica</Label>
              <Select
                value={form.id_clinica != null ? String(form.id_clinica) : NO_VALUE}
                onValueChange={(value) =>
                  handleChange("id_clinica", value === NO_VALUE ? null : Number(value))
                }
              >
                <SelectTrigger id="id_clinica">
                  <SelectValue placeholder="Selecciona una clínica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_VALUE}>Sin clínica</SelectItem>
                  {clinics?.map((clinic) => (
                    <SelectItem key={clinic.id} value={String(clinic.id)}>
                      {clinic.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="id_pieza">Pieza odontograma</Label>
              {piezaOptions && piezaOptions.length > 0 ? (
                <Select
                  value={form.id_pieza != null ? String(form.id_pieza) : NO_VALUE}
                  onValueChange={(value) =>
                    handleChange("id_pieza", value === NO_VALUE ? null : Number(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una pieza" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_VALUE}>Sin pieza</SelectItem>
                    {piezaOptions.map((piece) => (
                      <SelectItem key={piece.id} value={String(piece.id)}>
                        {piece.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              <Input
                id="id_pieza"
                type="number"
                min="0"
                value={form.id_pieza ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  handleChange("id_pieza", value ? Number(value) : null);
                }}
                placeholder="Ej. 128"
              />
              {pieceHint ? (
                <p className="text-xs text-muted-foreground">Seleccionada: {pieceHint}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="block">Estado</Label>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Facturado</p>
                  <p className="text-xs text-muted-foreground">Marcado cuando existe factura emitida</p>
                </div>
                <Switch
                  checked={Boolean(form.facturado)}
                  onCheckedChange={(checked) => handleChange("facturado", checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Pagado</p>
                  <p className="text-xs text-muted-foreground">Indica si el tratamiento fue cancelado</p>
                </div>
                <Switch
                  checked={Boolean(form.pagado)}
                  onCheckedChange={(checked) => handleChange("pagado", checked)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {initialData ? "Guardar cambios" : "Crear tratamiento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

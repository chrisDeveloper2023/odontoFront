import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Clinic, ClinicPayload } from "@/servicios/clinicas";

interface ClinicFormProps {
  initialClinic?: Clinic | null;
  onSubmit: (payload: ClinicPayload) => Promise<void> | void;
  onCancel?: () => void;
  saving?: boolean;
  submitLabel?: string;
  showResetButton?: boolean;
  className?: string;
}

const emptyState = {
  name: "",
  address: "",
  phone: "",
  email: "",
  status: "Activa" as "Activa" | "Inactiva",
};

const ClinicForm = ({
  initialClinic = null,
  onSubmit,
  onCancel,
  saving = false,
  submitLabel = "Guardar clinica",
  showResetButton = false,
  className,
}: ClinicFormProps) => {
  const [formData, setFormData] = useState(emptyState);

  useEffect(() => {
    if (!initialClinic) {
      setFormData(emptyState);
      return;
    }
    setFormData({
      name: initialClinic.nombre ?? "",
      address: initialClinic.direccion ?? "",
      phone: initialClinic.telefono ?? "",
      email: initialClinic.correo ?? "",
      status: initialClinic.activo ? "Activa" : "Inactiva",
    });
  }, [initialClinic?.id]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value as "Activa" | "Inactiva" }));
  };

  const handleReset = () => setFormData(emptyState);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      return;
    }
    const payload: ClinicPayload = {
      nombre: formData.name.trim(),
      direccion: formData.address.trim() || null,
      telefono: formData.phone.trim() || null,
      correo: formData.email.trim() || null,
      activo: formData.status === "Activa",
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className={className ? `${className} space-y-6` : "space-y-6"}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Nombre de la clinica</Label>
          <Input
            name="name"
            placeholder="Ej: Clinica Central (sin tilde)"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={saving}
          />
        </div>
        <div>
          <Label>Telefono</Label>
          <Input
            name="phone"
            placeholder="+593 987654321"
            value={formData.phone}
            onChange={handleChange}
            disabled={saving}
          />
        </div>
        <div className="md:col-span-2">
          <Label>Direccion</Label>
          <Textarea
            name="address"
            placeholder="Av. Principal 123"
            value={formData.address}
            onChange={handleChange}
            disabled={saving}
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            name="email"
            type="email"
            placeholder="contacto@clinica.com"
            value={formData.email}
            onChange={handleChange}
            disabled={saving}
          />
        </div>
        <div>
          <Label>Estado</Label>
          <Select value={formData.status} onValueChange={handleStatusChange} disabled={saving}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Activa">Activa</SelectItem>
              <SelectItem value="Inactiva">Inactiva</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-4 pt-4">
        {showResetButton ? (
          <Button type="button" variant="secondary" onClick={handleReset} disabled={saving}>
            Limpiar
          </Button>
        ) : null}
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default ClinicForm;



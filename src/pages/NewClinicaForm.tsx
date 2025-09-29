import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ClinicPayload, createClinic } from "@/servicios/clinicas";

const NewClinicForm = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    status: "Activa" as "Activa" | "Inactiva",
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value as "Activa" | "Inactiva" }));
  };

  const resetForm = () => {
    setFormData({ name: "", address: "", phone: "", email: "", status: "Activa" });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      toast.error("El nombre de la clinica es obligatorio");
      return;
    }

    const payload: ClinicPayload = {
      nombre: formData.name.trim(),
      direccion: formData.address.trim() || null,
      telefono: formData.phone.trim() || null,
      correo: formData.email.trim() || null,
      activo: formData.status === "Activa",
    };

    try {
      setSaving(true);
      await createClinic(payload);
      toast.success("Clinica registrada correctamente");
      resetForm();
      navigate("/clinics");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "No se pudo registrar la clinica");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Registrar clinica</CardTitle>
        <CardDescription>Completa la informacion basica de la clinica</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nombre de la clinica *</Label>
              <Input
                name="name"
                placeholder="Ej: Clinica Central"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label>Telefono</Label>
              <Input
                name="phone"
                placeholder="+593 987654321"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Direccion</Label>
              <Textarea
                name="address"
                placeholder="Av. Principal 123"
                value={formData.address}
                onChange={handleChange}
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
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={formData.status} onValueChange={handleStatusChange}>
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
            <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
              Limpiar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Registrar clinica"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default NewClinicForm;


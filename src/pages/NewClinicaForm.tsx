import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";



const NewClinicForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    status: "Activa",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStatusChange = (value: string) => {
    setFormData({ ...formData, status: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Clínica registrada:", formData);

    

    // Aquí podrías hacer un POST a una API...
    // await axios.post("/api/clinics", formData);

    navigate("/clinics"); // Redirigir a listado de clínicas
  };

  const handleReset = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      phone: "",
      email: "",
      status: "Activa",
    });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Registrar Clínica</CardTitle>
        <CardDescription>Completa la información de la clínica.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nombre de la Clínica</Label>
              <Input
                name="name"
                placeholder="Ej: Clínica Santa María"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label>Ciudad</Label>
              <Input
                name="city"
                placeholder="Ej: Quito"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Dirección</Label>
              <Textarea
                name="address"
                placeholder="Ej: Av. Siempre Viva 123"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                name="phone"
                placeholder="+593 987654321"
                value={formData.phone}
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
            <div className="md:col-span-2">
              <Label>Estado</Label>
              <Select value={formData.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full">
                  <span>{formData.status}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activa">Activa</SelectItem>
                  <SelectItem value="Inactiva">Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="secondary" onClick={handleReset}>
              Limpiar
            </Button>
            <Button type="submit">Registrar Clínica</Button>
          </div>
         </form>
      </CardContent>
    </Card>
  );
};

export default NewClinicForm;
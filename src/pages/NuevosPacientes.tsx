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
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

const NewPaciente = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
    email: "",
    status: "Activo",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenderChange = (value: string) => {
    setFormData({ ...formData, gender: value });
  };

  const handleStatusChange = (value: string) => {
    setFormData({ ...formData, status: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Paciente guardado:", formData);

    // Aquí podrías hacer un POST a una API...
    // await axios.post("/api/patients", formData);

    navigate("/patients"); // Redirigir a la lista de pacientes
  };

  const handleReset = () => {
    setFormData({
      name: "",
      age: "",
      gender: "",
      phone: "",
      email: "",
      status: "Activo",
    });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Nuevo Paciente</CardTitle>
        <CardDescription>Ingresa la información básica del paciente.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nombre completo</Label>
              <Input
                name="name"
                placeholder="Ej: Juan Pérez"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label>Edad</Label>
              <Input
                name="age"
                type="number"
                placeholder="Ej: 35"
                value={formData.age}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label>Género</Label>
              <Select value={formData.gender} onValueChange={handleGenderChange}>
                <SelectTrigger className="w-full">
                  <span>{formData.gender || "Seleccionar género"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Femenino">Femenino</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={formData.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full">
                  <span>{formData.status}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                name="phone"
                placeholder="+502 1234-5678"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                name="email"
                type="email"
                placeholder="ejemplo@email.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="flex gap-4 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={handleReset}>
              Limpiar
            </Button>
            <Button type="submit">Guardar Paciente</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default NewPaciente;

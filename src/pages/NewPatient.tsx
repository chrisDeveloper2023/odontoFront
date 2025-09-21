// src/pages/NewPatient.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { API_BASE } from "@/lib/http";

interface FormData {
  documentType: string;
  documentId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  allergies: string;
  occupation: string;
}

const NewPatient: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<FormData>({
    documentType: "Cedula",
    documentId: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    allergies: "",
    occupation: "",
  });

  // Cargar datos en modo edicion
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/pacientes/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();
        setFormData({
          documentType: raw.tipo_documento,
          documentId: raw.documento_identidad,
          firstName: raw.nombres,
          lastName: raw.apellidos,
          dateOfBirth: raw.fecha_nacimiento,
          gender: raw.sexo.toLowerCase(),
          phone: raw.telefono,
          email: raw.correo,
          address: raw.direccion,
          allergies: raw.observaciones,
          occupation: raw.ocupacion ?? "",
        });
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar datos: " + (err as Error).message);
      }
    })();
  }, [id]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validacion
    if (!formData.documentId || !formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.phone) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    try {
      const url = isEdit ? `${API_BASE}/pacientes/${id}` : `${API_BASE}/pacientes`;
      const method = isEdit ? "PUT" : "POST";
      const payload = {
        id_clinica: 1,
        tipo_documento: formData.documentType,
        documento_identidad: formData.documentId,
        nombres: formData.firstName,
        apellidos: formData.lastName,
        fecha_nacimiento: formData.dateOfBirth,
        telefono: formData.phone,
        correo: formData.email,
        direccion: formData.address,
        observaciones: formData.allergies,
        ocupacion: formData.occupation || null,
        sexo: formData.gender.toUpperCase(),
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(`Paciente ${isEdit ? "actualizado" : "creado"} exitosamente`);
      navigate("/patients");
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar: " + (err as Error).message);
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2" /> Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{isEdit ? "Editar Paciente" : "Nuevo Paciente"}</h1>
          <p className="text-muted-foreground">
            {isEdit ? "Modifica los datos del paciente" : "Registra un nuevo paciente"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informacion de Identidad</CardTitle>
            <CardDescription>Tipo y numero de documento *</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Documento *</Label>
              <Select value={formData.documentType} onValueChange={val => handleInputChange("documentType", val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cedula">Cedula</SelectItem>
                  <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Numero de Documento *</Label>
              <Input
                value={formData.documentId}
                onChange={e => handleInputChange("documentId", e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informacion Personal</CardTitle>
            <CardDescription>Datos basicos *</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nombres *</Label>
              <Input
                value={formData.firstName}
                onChange={e => handleInputChange("firstName", e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Apellidos *</Label>
              <Input
                value={formData.lastName}
                onChange={e => handleInputChange("lastName", e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Fecha de Nacimiento *</Label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={e => handleInputChange("dateOfBirth", e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Genero *</Label>
              <RadioGroup value={formData.gender} onValueChange={val => handleInputChange("gender", val)} className="flex space-x-4">
                <div className="flex items-center">
                  <RadioGroupItem value="masculino" id="male" /><Label htmlFor="male">Masculino</Label>
                </div>
                <div className="flex items-center">
                  <RadioGroupItem value="femenino" id="female" /><Label htmlFor="female">Femenino</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label>Ocupacion</Label>
              <Input
                value={formData.occupation}
                onChange={(e) => handleInputChange("occupation", e.target.value)}
                placeholder="Profesion, oficio, etc."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Telefono *</Label>
                <Input
                  value={formData.phone}
                  onChange={e => handleInputChange("phone", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e => handleInputChange("email", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Direccion</Label>
              <Textarea
                value={formData.address}
                onChange={e => handleInputChange("address", e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Observaciones/Alergias</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.allergies}
              onChange={e => handleInputChange("allergies", e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4 sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4 mt-4">
          <Button variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button type="submit" className="flex items-center gap-2">
            <Save className="h-4 w-4" /> {isEdit ? "Actualizar" : "Guardar"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewPatient;

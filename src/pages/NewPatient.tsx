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
import { apiGet, apiPost, apiPut } from "@/api/client";
import { useAuth } from "@/context/AuthContext";

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
  clinicId: number | null;
}

interface ClinicaOption {
  id: number;
  nombre: string;
}

const NewPatient: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { session } = useAuth();

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
    clinicId: null,
  });
  const [clinicas, setClinicas] = useState<ClinicaOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadClinicas() {
      try {
        const response = await apiGet<any>("/clinicas");
        const list: ClinicaOption[] = Array.isArray(response?.data)
          ? response.data.map((c: any) => ({ id: c.id ?? c.id_clinica, nombre: c.nombre ?? c.nombre_clinica }))
          : Array.isArray(response)
          ? response.map((c: any) => ({ id: c.id ?? c.id_clinica, nombre: c.nombre ?? c.nombre_clinica }))
          : [];
        const validList = list.filter((c) => Number.isFinite(c.id));
        setClinicas(validList);
        setFormData((prev) => ({
          ...prev,
          clinicId: prev.clinicId ?? validList[0]?.id ?? session?.usuario?.tenantId ?? null,
        }));
      } catch (err) {
        console.error(err);
        toast.error("No se pudieron cargar las clinicas");
      }
    }
    loadClinicas();
  }, [session?.usuario?.tenantId]);

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const raw = await apiGet<any>(`/pacientes/${id}`);
        setFormData({
          documentType: raw.tipo_documento,
          documentId: raw.documento_identidad,
          firstName: raw.nombres,
          lastName: raw.apellidos,
          dateOfBirth: raw.fecha_nacimiento?.substring(0, 10) ?? "",
          gender: raw.sexo?.toLowerCase() ?? "",
          phone: raw.telefono ?? "",
          email: raw.correo ?? "",
          address: raw.direccion ?? "",
          allergies: raw.observaciones ?? "",
          occupation: raw.ocupacion ?? "",
          clinicId: raw.id_clinica ?? null,
        });
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar datos: " + (err as Error).message);
      }
    })();
  }, [id, isEdit]);

  const handleInputChange = (field: keyof FormData, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.documentId || !formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.phone) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    if (!formData.clinicId) {
      toast.error("Selecciona una clinica");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        id_clinica: formData.clinicId,
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

      if (isEdit) {
        await apiPut(`/pacientes/${id}`, payload);
        toast.success("Paciente actualizado exitosamente");
      } else {
        await apiPost("/pacientes", payload);
        toast.success("Paciente creado exitosamente");
      }

      navigate("/patients");
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
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
              <Select value={formData.documentType} onValueChange={(val) => handleInputChange("documentType", val)}>
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
                onChange={(e) => handleInputChange("documentId", e.target.value)}
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
              <Label>Clinica *</Label>
              <Select value={formData.clinicId ? String(formData.clinicId) : undefined} onValueChange={(val) => handleInputChange("clinicId", Number(val))}>
                <SelectTrigger><SelectValue placeholder="Selecciona una clinica" /></SelectTrigger>
                <SelectContent>
                  {clinicas.map((clinica) => (
                    <SelectItem key={clinica.id} value={String(clinica.id)}>
                      {clinica.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nombres *</Label>
              <Input
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Apellidos *</Label>
              <Input
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Fecha de Nacimiento *</Label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Genero *</Label>
              <RadioGroup value={formData.gender} onValueChange={(val) => handleInputChange("gender", val)} className="flex space-x-4">
                <div className="flex items-center">
                  <RadioGroupItem value="masculino" id="male" /><Label htmlFor="male">Masculino</Label>
                </div>
                <div className="flex items-center">
                  <RadioGroupItem value="femenino" id="female" /><Label htmlFor="female">Femenino</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label>Telefono *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Direccion</Label>
              <Input value={formData.address} onChange={(e) => handleInputChange("address", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Ocupacion</Label>
              <Input value={formData.occupation} onChange={(e) => handleInputChange("occupation", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Observaciones</CardTitle>
            <CardDescription>Datos adicionales</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.allergies}
              onChange={(e) => handleInputChange("allergies", e.target.value)}
              placeholder="Alergias u observaciones"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            <Save className="mr-2" /> {isEdit ? "Actualizar" : "Guardar"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewPatient;
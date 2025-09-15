import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Save } from "lucide-react";

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
}

interface PatientEditModalProps {
  patientId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onPatientUpdated?: (updatedPatient: any) => void;
}

const PatientEditModal: React.FC<PatientEditModalProps> = ({
  patientId,
  isOpen,
  onClose,
  onPatientUpdated
}) => {
  const [formData, setFormData] = useState<FormData>({
    documentType: "Cédula",
    documentId: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    allergies: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load patient data when modal opens
  useEffect(() => {
    if (!patientId || !isOpen) {
      setFormData({
        documentType: "Cédula",
        documentId: "",
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        phone: "",
        email: "",
        address: "",
        allergies: "",
      });
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${import.meta.env.VITE_API_URL}/pacientes/${patientId}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(raw => {
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
        });
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        toast.error("Error al cargar datos: " + err.message);
      })
      .finally(() => setLoading(false));
  }, [patientId, isOpen]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.documentId || !formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.phone) {
      toast.error("Completa los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
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
        sexo: formData.gender.toUpperCase(),
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/pacientes/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      toast.success("Paciente actualizado exitosamente");
      
      // Notify parent component about update
      onPatientUpdated?.({
        id: patientId,
        name: `${formData.firstName} ${formData.lastName}`,
        // Add other fields as needed for the parent component
      });
      
      // Close modal
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Editar Paciente
          </DialogTitle>
        </DialogHeader>

        {loading && !formData.firstName && (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Cargando datos del paciente…</div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-8">
            <div className="text-red-600">Error: {error}</div>
          </div>
        )}

        {!loading && !error && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de Identidad</CardTitle>
                <CardDescription>Tipo y número de documento *</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Documento *</Label>
                  <Select value={formData.documentType} onValueChange={val => handleInputChange("documentType", val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cédula">Cédula</SelectItem>
                      <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Número de Documento *</Label>
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
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Datos básicos *</CardDescription>
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
                  <Label>Género *</Label>
                  <RadioGroup value={formData.gender} onValueChange={val => handleInputChange("gender", val)} className="flex space-x-4">
                    <div className="flex items-center">
                      <RadioGroupItem value="masculino" id="male" /><Label htmlFor="male">Masculino</Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="femenino" id="female" /><Label htmlFor="female">Femenino</Label>
                    </div>
                  </RadioGroup>
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
                    <Label>Teléfono *</Label>
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
                  <Label>Dirección</Label>
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

            <div className="flex justify-end space-x-4 pt-4">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {loading ? "Guardando..." : "Actualizar"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PatientEditModal;

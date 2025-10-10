import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Save, X } from "lucide-react";
import { apiGet, apiPost, apiPut } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { getClinicas } from "@/lib/api/clinicas";

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

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientCreated?: (patient: any) => void;
  patientId?: string | null; // Para modo edición
}

const NewPatientModal: React.FC<NewPatientModalProps> = ({
  isOpen,
  onClose,
  onPatientCreated,
  patientId = null
}) => {
  const { session } = useAuth();
  const tenantId = session?.usuario?.tenant_id ?? session?.usuario?.tenant?.id ?? null;
  const isEdit = Boolean(patientId);

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

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (!isEdit) {
        // Reset form for new patient
        setFormData({
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
      }
    }
  }, [isOpen, isEdit]);

  useEffect(() => {
    if (!isOpen) return;
    
    async function loadClinicas() {
      try {
        const response = await getClinicas();
        const validList: ClinicaOption[] = response
          .map((c: any) => ({
            id: Number(c.id ?? c.id_clinica ?? c.idClinica ?? c.clinica_id),
            nombre: c.nombre ?? c.nombre_clinica ?? c.name ?? `Clinica ${c.id ?? ""}`,
          }))
          .filter((c: ClinicaOption) => Number.isFinite(c.id));
        setClinicas(validList);
        setFormData((prev) => ({
          ...prev,
          clinicId: prev.clinicId ?? validList[0]?.id ?? tenantId,
        }));
      } catch (err) {
        console.error(err);
        toast.error("No se pudieron cargar las clinicas");
      }
    }
    loadClinicas();
  }, [isOpen, tenantId]);

  useEffect(() => {
    if (!isOpen || !isEdit || !patientId) return;
    (async () => {
      try {
        const raw = await apiGet<any>(`/pacientes/${patientId}`);
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
  }, [patientId, isEdit, isOpen]);

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

      let result;
      if (isEdit) {
        result = await apiPut(`/pacientes/${patientId}`, payload);
        toast.success("Paciente actualizado exitosamente");
      } else {
        result = await apiPost("/pacientes", payload);
        toast.success("Paciente creado exitosamente");
      }

      if (onPatientCreated) {
        onPatientCreated(result);
      }
      
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
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? "Editar Paciente" : "Nuevo Paciente"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Modifica los datos del paciente" : "Registra un nuevo paciente"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información de Identidad */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Información de Identidad</h3>
              <p className="text-sm text-muted-foreground">Tipo y número de documento *</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label>Número de Documento *</Label>
                <Input
                  value={formData.documentId}
                  onChange={(e) => handleInputChange("documentId", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Información Personal */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Información Personal</h3>
              <p className="text-sm text-muted-foreground">Datos básicos *</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Clínica *</Label>
                <Select value={formData.clinicId ? String(formData.clinicId) : undefined} onValueChange={(val) => handleInputChange("clinicId", Number(val))}>
                  <SelectTrigger><SelectValue placeholder="Selecciona una clínica" /></SelectTrigger>
                  <SelectContent>
                    {clinicas.map((clinica) => (
                      <SelectItem key={clinica.id} value={String(clinica.id)}>
                        {clinica.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clinicas.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    No hay clinicas disponibles en tu tenant o estan inactivas. Contacta al administrador.
                  </p>
                )}
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
                <Label>Género *</Label>
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
                <Label>Teléfono *</Label>
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
                <Label>Dirección</Label>
                <Input value={formData.address} onChange={(e) => handleInputChange("address", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>Ocupación</Label>
                <Input value={formData.occupation} onChange={(e) => handleInputChange("occupation", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Observaciones</h3>
              <p className="text-sm text-muted-foreground">Datos adicionales</p>
            </div>
            <Textarea
              value={formData.allergies}
              onChange={(e) => handleInputChange("allergies", e.target.value)}
              placeholder="Alergias u observaciones"
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {isEdit ? "Actualizar" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewPatientModal;

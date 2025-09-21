import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Edit, FileText, Trash2 } from "lucide-react";

interface RawPaciente {
  id_paciente: number;
  id_clinica: number;
  tipo_documento: string;
  documento_identidad: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  telefono: string;
  correo: string;
  direccion: string;
  observaciones: string;
  activo: boolean;
  sexo: string;
}

interface PatientDetail {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  address: string;
  observations: string;
  documentType: string;
  document: string;
  status: "Activo" | "Inactivo";
}

interface PatientDetailModalProps {
  patientId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onPatientDeleted?: (patientId: string) => void;
  onEditPatient?: (patientId: string) => void;
}

const calculateAge = (dob: string): number => {
  if (!dob) return 0;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return isNaN(age) ? 0 : age;
};

const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  patientId,
  isOpen,
  onClose,
  onPatientDeleted,
  onEditPatient
}) => {
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId || !isOpen) {
      setPatient(null);
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
      .then((raw: RawPaciente) => {
        const mapped: PatientDetail = {
          id: String(raw.id_paciente),
          name: `${raw.nombres} ${raw.apellidos}`,
          age: calculateAge(raw.fecha_nacimiento),
          gender: raw.sexo.charAt(0) + raw.sexo.slice(1).toLowerCase(),
          phone: raw.telefono,
          email: raw.correo,
          address: raw.direccion,
          observations: raw.observaciones,
          documentType: raw.tipo_documento,
          document: raw.documento_identidad,
          status: raw.activo ? "Activo" : "Inactivo",
        };
        setPatient(mapped);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [patientId, isOpen]);

  const handleDelete = async () => {
    if (!patient) return;
    if (!window.confirm("¿Estás seguro de eliminar este paciente?")) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/pacientes/${patient.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      // Notify parent component about deletion
      onPatientDeleted?.(patient.id);
      
      // Close modal
      onClose();
      
      alert("Paciente eliminado correctamente");
    } catch (err) {
      console.error(err);
      alert("Error al eliminar paciente");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Detalle del Paciente
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Cargando detalle…</div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-8">
            <div className="text-red-600">Error: {error}</div>
          </div>
        )}

        {patient && !loading && !error && (
          <div className="space-y-6">
            {/* Patient Header */}
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="text-xl font-bold">{patient.name}</CardTitle>
                <Badge variant={patient.status === "Activo" ? "default" : "secondary"}>
                  {patient.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div><strong>Documento:</strong> {patient.documentType} - {patient.document}</div>
                    <div><strong>Edad:</strong> {patient.age} años</div>
                    <div><strong>Género:</strong> {patient.gender}</div>
                  </div>
                  <div className="space-y-2">
                    <div><strong>Teléfono:</strong> {patient.phone}</div>
                    <div><strong>Email:</strong> {patient.email || "No especificado"}</div>
                  </div>
                </div>
                
                {patient.address && (
                  <div>
                    <strong>Dirección:</strong>
                    <p className="text-muted-foreground mt-1">{patient.address}</p>
                  </div>
                )}
                
                {patient.observations && (
                  <div>
                    <strong>Observaciones:</strong>
                    <p className="text-muted-foreground mt-1">{patient.observations}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 justify-end">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => {
                  onEditPatient?.(patient.id);
                  onClose();
                }}
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
              <Link to={`/medical-records/new?patientId=${patient.id}`} onClick={onClose}>
                <Button className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Nueva Historia
                </Button>
              </Link>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PatientDetailModal;

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

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

const calculateAge = (dob: string): number => {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`${import.meta.env.VITE_API_URL}/pacientes/${id}`)
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
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!patient) return;
    if (!window.confirm("¿Estás seguro de eliminar este paciente?")) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/pacientes/${patient.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      alert("Paciente eliminado correctamente");
      navigate("/patients");
    } catch (err) {
      console.error(err);
      alert("Error al eliminar paciente");
    }
  };

  if (loading) return <div className="p-4">Cargando detalle…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!patient) return <div className="p-4">Paciente no encontrado</div>;

  return (
    <div className="p-4">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ChevronLeft className="mr-2" /> Volver
      </Button>

      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">{patient.name}</CardTitle>
          <span className={`px-2 py-1 text-sm rounded ${patient.status === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {patient.status}
          </span>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><strong>Documento:</strong> {patient.documentType} - {patient.document}</div>
          <div><strong>Edad:</strong> {patient.age} años</div>
          <div><strong>Género:</strong> {patient.gender}</div>
          <div><strong>Teléfono:</strong> {patient.phone}</div>
          <div><strong>Email:</strong> {patient.email}</div>
          <div><strong>Dirección:</strong> {patient.address}</div>
          <div><strong>Observaciones:</strong> {patient.observations}</div>
        </CardContent>
      </Card>

      <div className="mt-4 flex gap-2">
        <Link to={`/patients/${patient.id}/edit`}>
          <Button>Editar</Button>
        </Link>
        <Link to={`/medical-records/new?patientId=${patient.id}`}>
          <Button>Historia</Button>
        </Link>
        <Button variant="destructive" onClick={handleDelete}>
          Eliminar
        </Button>
      </div>
    </div>
  );
};

export default PatientDetail;

// src/pages/AppointmentDetail.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit2 } from "lucide-react";

interface Appointment {
  id_cita: number;
  fecha_hora: string;
  estado: string;
  observaciones: string | null;
  paciente: {
    id_paciente: number;
    nombres: string;
    apellidos: string;
    documento_identidad: string;
    tipo_documento: string;
  };
  odontologo: {
    id: number;
    nombres: string;
    apellidos: string;
    rol: {
      id_rol: number;
      nombre_rol: string;
    };
  };
  consultorio: {
    id_consultorio: number;
    nombre: string;
  };
  clinica?: {
    id: number;
    nombre: string;
  } | null;
}

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cita, setCita] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/citas/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Appointment) => setCita(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="p-4">Cargando cita…</p>;
  if (error)   return <p className="p-4 text-red-600">Error: {error}</p>;
  if (!cita)  return <p className="p-4">No se encontró la cita #{id}.</p>;

  const fecha = new Date(cita.fecha_hora);
  const fechaStr = fecha.toLocaleDateString();
  const horaStr  = fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6 p-4">
      {/* Botón Volver */}
      <Button variant="outline" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Volver
      </Button>

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cita #{cita.id_cita}</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/appointments/${cita.id_cita}/edit`)}
          className="flex items-center gap-1"
        >
          <Edit2 className="h-4 w-4" /> Editar
        </Button>
      </div>

      {/* Detalle */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles de la cita</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            <strong>Paciente:</strong>{" "}
            {cita.paciente.nombres} {cita.paciente.apellidos} (
            {cita.paciente.tipo_documento}: {cita.paciente.documento_identidad})
          </p>
          <p>
            <strong>Odontólogo:</strong>{" "}
            {cita.odontologo.nombres} {cita.odontologo.apellidos} —{" "}
            <em>{cita.odontologo.rol.nombre_rol}</em>
          </p>
          <p>
            <strong>Consultorio:</strong> {cita.consultorio.nombre}
          </p>
          {cita.clinica && (
            <p>
              <strong>Clínica:</strong> {cita.clinica.nombre}
            </p>
          )}
          <p>
            <strong>Fecha y hora:</strong> {fechaStr} a las {horaStr}
          </p>
          <p>
            <strong>Estado:</strong> {cita.estado}
          </p>
          <p>
            <strong>Observaciones:</strong>{" "}
            {cita.observaciones || "—"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


// src/pages/AppointmentDetail.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit2 } from "lucide-react";
import { apiPatch } from "@/api/client";
import { toast } from "sonner";
import { API_BASE } from "@/lib/http";
import { formatGuayaquilDate, formatGuayaquilTimeHM } from "@/lib/timezone";

const ESTADOS_CITA = ["AGENDADA", "CONFIRMADA", "CANCELADA", "COMPLETADA"] as const;

type Appointment = {
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
};

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [cita, setCita] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingEstado, setUpdatingEstado] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/citas/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Appointment) => setCita(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEstadoChange = async (nuevoEstado: string) => {
    if (!cita || nuevoEstado === cita.estado) return;
    try {
      setUpdatingEstado(true);
      await apiPatch(`/citas/${cita.id_cita}/estado`, { estado: nuevoEstado });
      setCita((prev) => (prev ? { ...prev, estado: nuevoEstado } : prev));
      toast.success(`Estado actualizado a ${nuevoEstado}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "No se pudo actualizar el estado de la cita");
    } finally {
      setUpdatingEstado(false);
    }
  };

  if (loading) return <p className="p-4">Cargando cita...</p>;
  if (error) return <p className="p-4 text-red-600">Error: {error}</p>;
  if (!cita) return <p className="p-4">No se encontro la cita #{id}.</p>;

  const fechaStr = formatGuayaquilDate(cita.fecha_hora, { dateStyle: "long" }) || "";
  const horaStr = formatGuayaquilTimeHM(cita.fecha_hora);

  return (
    <div className="space-y-6 p-4">
      <Button variant="outline" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Volver
      </Button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cita #{cita.id_cita}</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const res = await fetch(`${API_BASE}/citas/${cita.id_cita}/historias-clinicas/abrir`, { method: "POST" });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const hist = await res.json();
                const idHistoria = hist?.id_historia || hist?.id || hist?.historia?.id_historia;
                if (idHistoria) {
                  navigate(`/medical-records/${idHistoria}`, {
                    state: { background: location.state?.background ?? location },
                  });
                }
              } catch (e) {
                console.error("No se pudo abrir la historia clinica desde la cita:", e);
                toast.error("No se pudo abrir la historia clinica");
              }
            }}
          >
            Abrir historia clinica
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/appointments/${cita.id_cita}/edit`)}
            className="flex items-center gap-1"
          >
            <Edit2 className="h-4 w-4" /> Editar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles de la cita</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Paciente</Label>
            <p>
              {cita.paciente.nombres} {cita.paciente.apellidos} ({cita.paciente.tipo_documento}: {cita.paciente.documento_identidad})
            </p>
          </div>
          <div>
            <Label>Odontologo</Label>
            <p>
              {cita.odontologo.nombres} {cita.odontologo.apellidos} - <em>{cita.odontologo.rol.nombre_rol}</em>
            </p>
          </div>
          <div>
            <Label>Consultorio</Label>
            <p>{cita.consultorio.nombre}</p>
          </div>
          {cita.clinica && (
            <div>
              <Label>Clinica</Label>
              <p>{cita.clinica.nombre}</p>
            </div>
          )}
          <div>
            <Label>Fecha y hora</Label>
            <p>{fechaStr} - {horaStr}</p>
          </div>
          <div>
            <Label>Estado</Label>
            <Select value={cita.estado ?? ""} onValueChange={handleEstadoChange} disabled={updatingEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona estado" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_CITA.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Observaciones</Label>
            <p>{cita.observaciones || "Sin observaciones"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

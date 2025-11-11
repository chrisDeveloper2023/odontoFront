
// src/pages/AppointmentDetail.tsx
import { useState } from "react";
import { useParams, useNavigate, useLocation, type Location } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit2 } from "lucide-react";
import { apiGet, apiPatch } from "@/api/client";
import { toast } from "sonner";
import { formatGuayaquilDate, formatGuayaquilTimeHM } from "@/lib/timezone";
import CitaTimeline from "@/components/CitaTimeline";

const ESTADOS_CITA = ["AGENDADA", "CONFIRMADA", "REALIZADA", "CANCELADA"] as const;

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
    tenant?: {
      id: number;
      nombre?: string;
      slug?: string;
    } | null;
  } | null;
  tenant?: {
    id: number;
    nombre?: string;
    slug?: string;
  } | null;
};

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const backgroundLocation = (location.state as { background?: Location } | undefined)?.background;
  const citaId = Number(id);
  const [error, setError] = useState<string | null>(null);
  const [updatingEstado, setUpdatingEstado] = useState(false);

  const citaQuery = useQuery({
    queryKey: ["cita", citaId],
    enabled: Number.isFinite(citaId),
    queryFn: async () => {
      const data = await apiGet<Appointment>(`/citas/${citaId}`);
      setError(null);
      return data;
    },
    onError: (err: any) => {
      const message =
        err?.status === 403
          ? "No tienes acceso a esta cita (403)"
          : err?.message || "Error al cargar la cita";
      setError(message);
      if (err?.status === 403) {
        toast.error(message);
      }
    },
    staleTime: 15_000,
  });

  const cita = citaQuery.data ?? null;
  const loading = citaQuery.isLoading;

  const handleEstadoChange = async (nuevoEstado: string) => {
    if (!cita || nuevoEstado === cita.estado) return;
    try {
      setUpdatingEstado(true);
      await apiPatch(`/citas/${cita.id_cita}/estado`, { estado: nuevoEstado });
      await queryClient.invalidateQueries({ queryKey: ["cita", cita.id_cita] });
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
            variant="ghost"
            size="sm"
            onClick={() => {
              const nextBackground = backgroundLocation ?? location;
              navigate(`/appointments/${cita.id_cita}/edit`, {
                state: { background: nextBackground },
              });
            }}
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
          {(cita.tenant || cita.clinica?.tenant) && (
            <div>
              <Label>Tenant</Label>
              <p>{cita.tenant?.nombre || cita.tenant?.slug || cita.clinica?.tenant?.nombre || cita.clinica?.tenant?.slug || 'Sin tenant'}</p>
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

      {cita && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Linea de tiempo clinica</h2>
          <CitaTimeline
            citaId={cita.id_cita}
            pacienteId={cita.paciente.id_paciente}
            onOpenHistoria={(historiaId) => {
              const nextBackground = backgroundLocation ?? location;
              navigate(`/medical-records/${historiaId}`, {
                state: { background: nextBackground },
              });
            }}
          />
        </section>
      )}
    </div>
  );
}

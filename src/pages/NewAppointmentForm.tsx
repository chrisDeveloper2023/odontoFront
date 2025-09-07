// src/pages/NewAppointment.tsx
import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";

// Servicio para disponibilidad
import { getDisponibilidad } from "@/servicios/citas";
import { getOdontologos } from "@/servicios/usuarios";


interface Paciente {
  id_paciente: number;
  nombres: string;
  apellidos: string;
}

interface Doctor {
  id: number;
  nombres: string;
  apellidos: string;
  rol: {
    id_rol: number;
    nombre: string;
  };
}

interface Consultorio {
  id_consultorio: number;
  nombre: string;
}
// Convierte "YYYY-MM-DD", "HH:mm" a "YYYY-MM-DDTHH:mm:00±HH:MM"
function buildISOWithOffset(fecha: string, hora: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const [hh, mm] = hora.split(":").map(Number);

  // Construye fecha local del navegador (sin convertir a UTC)
  const local = new Date(y, (m - 1), d, hh, mm, 0);

  // Offset en minutos respecto a UTC (Ecuador -> 300)
  const offsetMin = local.getTimezoneOffset();        // ej. 300
  const sign = offsetMin > 0 ? "-" : "+";             // 300 -> "-"
  const abs = Math.abs(offsetMin);
  const offHH = String(Math.floor(abs / 60)).padStart(2, "0");
  const offMM = String(abs % 60).padStart(2, "0");

  const YYYY = String(y).padStart(4, "0");
  const MM = String(m).padStart(2, "0");
  const DD = String(d).padStart(2, "0");
  const HH = String(hh).padStart(2, "0");
  const MI = String(mm).padStart(2, "0");

  return `${YYYY}-${MM}-${DD}T${HH}:${MI}:00${sign}${offHH}:${offMM}`;
}


const ODONTOLOGO_ROLE_ID = 1; // ajusta si tu rol de odontólogo tuviese otro id

const NewAppointmentForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    id_paciente: "",
    id_odontologo: "",
    id_consultorio: "",
    id_clinica: "",
    fecha: "",
    hora: "",
    observaciones: "",
  });

  const [duracion, setDuracion] = useState<number>(30);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // 1) Pacientes y consultorios (igual que antes)
        const [pacRes, conRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/pacientes`),
          fetch(`${import.meta.env.VITE_API_URL}/consultorios`),
        ]);

        const [pacData, conData] = await Promise.all([
          pacRes.json(),
          conRes.json(),
        ]);

        setPacientes(Array.isArray(pacData) ? pacData : pacData.data || []);
        setConsultorios(Array.isArray(conData) ? conData : conData.data || []);

        // 2) MÉDICOS (Odontólogos) — ahora vienen del servicio
        const docs = await getOdontologos();
        setDoctores(docs);
        console.debug("Odontólogos detectados:", docs);
      } catch (err) {
        console.error("Error cargando listas:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);


  // Helper: sacar "HH:mm" de un ISO (evita corrimientos por zona horaria)
  const isoToHHmm = (iso: string) => iso.slice(11, 16);

  // Cargar disponibilidad cuando hay consultorio + fecha + duración
  useEffect(() => {
    const { id_consultorio, fecha } = formData;
    // Al cambiar filtros, limpia hora seleccionada para evitar inconsistencias
    setFormData((prev) => ({ ...prev, hora: "" }));

    if (!id_consultorio || !fecha || !duracion) {
      setSlots([]);
      setSlotsError(null);
      return;
    }

    (async () => {
      setSlotsLoading(true);
      setSlotsError(null);
      try {
        const data = await getDisponibilidad(Number(id_consultorio), fecha, duracion);
        const list = Array.isArray(data.disponibles) ? data.disponibles : [];
        setSlots(list);
      } catch (e) {
        setSlots([]);
        setSlotsError((e as Error).message || "No se pudo cargar disponibilidad");
      } finally {
        setSlotsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.id_consultorio, formData.fecha, duracion]);

  const handleSelectChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        id_paciente: Number(formData.id_paciente),
        id_odontologo: Number(formData.id_odontologo),
        id_consultorio: Number(formData.id_consultorio),
        id_clinica: formData.id_clinica ? Number(formData.id_clinica) : null,
        fecha_hora: buildISOWithOffset(formData.fecha, formData.hora),

        observaciones: formData.observaciones || null,
        estado: "AGENDADA",
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/citas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.mensaje || "Error al agendar cita");
      }
      navigate("/appointments");
    } catch (err) {
      console.error("Error creando cita:", err);
      alert((err as Error).message);
    }
  };

  const submitDisabled =
    !formData.id_paciente ||
    !formData.id_odontologo ||
    !formData.id_consultorio ||
    !formData.fecha ||
    !formData.hora;

  if (loading) return <div className="p-4">Cargando datos...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agendar Cita Médica</h1>
          <p className="text-muted-foreground">Registra una nueva cita.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Información de la Consulta
            </CardTitle>
            <CardDescription>
              Completa los datos para agendar una nueva cita.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Paciente */}
              <div>
                <Label>Paciente</Label>
                <Select
                  value={formData.id_paciente}
                  onValueChange={(v) => handleSelectChange("id_paciente", v)}
                >
                  <SelectTrigger className="w-full">
                    {formData.id_paciente
                      ? (() => {
                        const p = pacientes.find(
                          (x) => String(x.id_paciente) === formData.id_paciente
                        );
                        return p ? `${p.nombres} ${p.apellidos}` : "Seleccionar paciente";
                      })()
                      : "Seleccionar paciente"}
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((p) => (
                      <SelectItem key={p.id_paciente} value={String(p.id_paciente)}>
                        {p.nombres} {p.apellidos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Médico */}
              <div>
                <Label>Médico</Label>
                <Select
                  value={formData.id_odontologo}
                  onValueChange={(v) => handleSelectChange("id_odontologo", v)}
                >
                  <SelectTrigger className="w-full">
                    {formData.id_odontologo
                      ? (() => {
                        const d = doctores.find((x) => String(x.id) === formData.id_odontologo);
                        return d ? `${d.nombres} ${d.apellidos}` : "Seleccionar médico";
                      })()
                      : "Seleccionar médico"}
                  </SelectTrigger>
                  <SelectContent>
                    {doctores.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.nombres} {d.apellidos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Consultorio */}
              <div>
                <Label>Consultorio</Label>
                <Select
                  value={formData.id_consultorio}
                  onValueChange={(v) => handleSelectChange("id_consultorio", v)}
                >
                  <SelectTrigger className="w-full">
                    {formData.id_consultorio
                      ? (() => {
                        const c = consultorios.find(
                          (x) => String(x.id_consultorio) === formData.id_consultorio
                        );
                        return c ? c.nombre : "Seleccionar consultorio";
                      })()
                      : "Seleccionar consultorio"}
                  </SelectTrigger>
                  <SelectContent>
                    {consultorios.map((c) => (
                      <SelectItem key={c.id_consultorio} value={String(c.id_consultorio)}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fecha */}
              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => handleSelectChange("fecha", e.target.value)}
                  required
                />
              </div>

              {/* Duración */}
              <div>
                <Label>Duración (min)</Label>
                <Select value={String(duracion)} onValueChange={(v) => setDuracion(Number(v))}>
                  <SelectTrigger className="w-full">
                    {duracion ? `${duracion} minutos` : "Seleccionar"}
                  </SelectTrigger>
                  <SelectContent>
                    {[15, 20, 30, 45, 60].map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {m} minutos
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Horarios disponibles */}
              <div className="md:col-span-2">
                <Label>Horarios disponibles</Label>
                <Select
                  value={formData.hora}
                  onValueChange={(v) => handleSelectChange("hora", v)}
                  disabled={slotsLoading || slots.length === 0}
                >
                  <SelectTrigger className="w-full">
                    {formData.hora
                      ? formData.hora
                      : slotsLoading
                        ? "Cargando disponibilidad…"
                        : slots.length
                          ? "Seleccionar horario"
                          : slotsError
                            ? "Error al cargar horarios"
                            : "No hay horarios para los filtros seleccionados"}
                  </SelectTrigger>
                  <SelectContent>
                    {slots.map((iso) => {
                      const hhmm = isoToHHmm(iso);
                      return (
                        <SelectItem key={iso} value={hhmm}>
                          {hhmm}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {slotsError && (
                  <p className="text-xs text-red-500 mt-1">
                    {slotsError}. Intenta cambiar fecha, consultorio o duración.
                  </p>
                )}
              </div>

              {/* Hora manual (override) */}
              <div>
                <Label>Hora (manual / override)</Label>
                <Input
                  type="time"
                  value={formData.hora}
                  onChange={(e) => handleSelectChange("hora", e.target.value)}
                  required
                />
              </div>

              {/* Observaciones */}
              <div className="md:col-span-2">
                <Label>Observaciones</Label>
                <Textarea
                  value={formData.observaciones}
                  onChange={(e) => handleSelectChange("observaciones", e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="reset"
                variant="secondary"
                onClick={() =>
                  setFormData({
                    id_paciente: "",
                    id_odontologo: "",
                    id_consultorio: "",
                    id_clinica: "",
                    fecha: "",
                    hora: "",
                    observaciones: "",
                  })
                }
              >
                Limpiar
              </Button>
              <Button type="submit" disabled={submitDisabled}>
                Agendar Cita
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default NewAppointmentForm;
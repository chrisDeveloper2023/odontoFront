// src/pages/NewAppointment.tsx
import { useState, useEffect, useMemo } from "react";
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
import { useLocation, useNavigate, type Location } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";
import { toast } from "sonner";

// Servicio para disponibilidad
import { getDisponibilidad } from "@/servicios/citas";
import { apiGet, apiPost } from "@/api/client";
import { getOdontologos } from "@/lib/api/catalog";
import { combineDateAndTimeGuayaquil, formatGuayaquilTimeHM } from "@/lib/timezone";

interface Paciente {
  id_paciente: number;
  nombres: string;
  apellidos: string;
}

type OdontologoOption = {
  id: number;
  nombre: string;
  correo: string;
  id_clinica: number;
};

interface Consultorio {
  id_consultorio: number;
  nombre: string;
}
// Convierte "YYYY-MM-DD", "HH:mm" a un ISO fijo en zona América/Guayaquil
function buildISOWithOffset(fecha: string, hora: string): string {
  return combineDateAndTimeGuayaquil(fecha, hora);
}


const NewAppointmentForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const backgroundLocation = (location.state as { background?: Location } | undefined)?.background;

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
  const [odontologos, setOdontologos] = useState<OdontologoOption[]>([]);
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [clinicas, setClinicas] = useState<{ id: number; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [pacData, conData] = await Promise.all([
          apiGet<any>("/pacientes", { page: 1, limit: 1000 }).catch(() => ({ data: [] })),
          apiGet<any>("/consultorios").catch(() => ({ data: [] })),
        ]);

        setPacientes(Array.isArray(pacData) ? pacData : pacData?.data || []);
        setConsultorios(Array.isArray(conData) ? conData : conData?.data || []);

        const clinRes = await apiGet<any>("/clinicas").catch(() => null);
        if (clinRes) {
          const list = Array.isArray(clinRes?.data) ? clinRes.data : Array.isArray(clinRes) ? clinRes : [];
          const mapped = list
            .map((c: any) => ({
              id: Number(c?.id ?? c?.id_clinica ?? c?.idClinica ?? 0),
              nombre: String(c?.nombre ?? c?.nombre_clinica ?? c?.name ?? ""),
            }))
            .filter((c) => Number.isFinite(c.id) && c.nombre.length > 0);
          setClinicas(mapped);
        } else {
          setClinicas([]);
        }

        try {
          const res = await getOdontologos();
          const arr = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
          const mappedOdontologos: OdontologoOption[] = arr
            .map((o: any) => ({
              id: Number(o?.id ?? o?.id_usuario ?? 0),
              nombre: `${String(o?.apellidos ?? "").trim()} ${String(o?.nombres ?? "").trim()}`
                .trim()
                || String(o?.correo ?? ""),
              correo: String(o?.correo ?? ""),
              id_clinica: Number(o?.id_clinica ?? 0),
            }))
            .filter((o) => Number.isFinite(o.id));
          setOdontologos(mappedOdontologos);
        } catch (docsErr) {
          console.error("No se pudieron cargar odontologos:", docsErr);
          setOdontologos([]);
        }
      } catch (err) {
        console.error("Error cargando listas:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Seleccionar automáticamente clínica si sólo hay una
  useEffect(() => {
    if (clinicas.length === 1 && !formData.id_clinica) {
      setFormData((prev) => ({ ...prev, id_clinica: String(clinicas[0].id) }));
    }
  }, [clinicas, formData.id_clinica]);


  // Helper: sacar "HH:mm" de un ISO (evita corrimientos por zona horaria)
  const isoToHHmm = (iso: string) => {
    if (!iso) return "";
    if (iso.length >= 16 && iso[10] === "T") {
      const hhmm = iso.slice(11, 16);
      if (/^\d{2}:\d{2}$/.test(hhmm)) {
        return hhmm;
      }
    }
    const formatted = formatGuayaquilTimeHM(iso);
    return formatted || "";
  };

  // Cargar disponibilidad cuando hay consultorio + fecha + duracion
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
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "id_clinica" ? { id_consultorio: "" } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        id_paciente: Number(formData.id_paciente),
        id_odontologo: Number(formData.id_odontologo),
        id_consultorio: Number(formData.id_consultorio),
        id_clinica: Number(formData.id_clinica),
        fecha_hora: buildISOWithOffset(formData.fecha, formData.hora),

        observaciones: formData.observaciones || null,
        estado: "AGENDADA",
      };

      await apiPost("/citas", payload);
      toast.success("Cita agendada correctamente");
      if (backgroundLocation) {
        navigate(-1);
      } else {
        navigate("/appointments", { replace: true });
      }
    } catch (err) {
      console.error("Error creando cita:", err);
      const message = err instanceof Error ? err.message : "No se pudo agendar la cita";
      toast.error(message);
    }
  };

  const submitDisabled =
    !formData.id_paciente ||
    !formData.id_odontologo ||
    !formData.id_consultorio ||
    !formData.id_clinica ||
    !formData.fecha ||
    !formData.hora;

  const consultoriosFiltrados = useMemo(() => {
    if (!formData.id_clinica) {
      return consultorios;
    }
    const clinicaId = formData.id_clinica;
    return consultorios.filter((consultorio) => {
      const rawId = consultorio?.id_clinica ?? (consultorio as any)?.clinica_id ?? null;
      return String(rawId ?? "") === clinicaId;
    });
  }, [consultorios, formData.id_clinica]);

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
          <h1 className="text-3xl font-bold text-foreground">Agendar Cita Medica</h1>
          <p className="text-muted-foreground">Registra una nueva cita.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Informacion de la Consulta
            </CardTitle>
            <CardDescription>
              Completa los datos para agendar una nueva cita.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Clinica (requerida) */}
              <div className="md:col-span-2">
                <Label>Clinica</Label>
                <Select
                  value={formData.id_clinica}
                  onValueChange={(v) => handleSelectChange("id_clinica", v)}
                >
                  <SelectTrigger className="w-full h-11">
                    {formData.id_clinica
                      ? (() => {
                          const c = clinicas.find((x) => String(x.id) === formData.id_clinica);
                          return c ? c.nombre : "Seleccionar clinica";
                        })()
                      : "Seleccionar clinica"}
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {clinicas.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clinicas.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No hay clinicas disponibles en tu tenant o estan inactivas. Contacta al administrador.
                  </p>
                )}
              </div>
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

              {/* Medico */}
              <div>
                <Label>Medico</Label>
                <Select
                  value={formData.id_odontologo}
                  onValueChange={(v) => handleSelectChange("id_odontologo", v)}
                >
                  <SelectTrigger className="w-full">
                    {formData.id_odontologo
                      ? (() => {
                        const d = odontologos.find((x) => String(x.id) === formData.id_odontologo);
                        return d ? d.nombre : "Seleccionar medico";
                      })()
                      : "Seleccionar medico"}
                  </SelectTrigger>
                  <SelectContent>
                    {odontologos.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.nombre}
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
                          const c = consultoriosFiltrados.find(
                            (x) => String(x.id_consultorio) === formData.id_consultorio
                          );
                          return c ? c.nombre : "Seleccionar consultorio";
                        })()
                      : consultoriosFiltrados.length
                        ? "Seleccionar consultorio"
                        : "No hay consultorios disponibles"}
                  </SelectTrigger>
                  <SelectContent>
                    {consultoriosFiltrados.map((c) => (
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

              {/* Duracion */}
              <div>
                <Label>Duracion (min)</Label>
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
                        ? "Cargando disponibilidad..."
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
                    {slotsError}. Intenta cambiar fecha, consultorio o duracion.
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

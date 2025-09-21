// src/pages/AppointmentEdit.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ArrowLeft, User } from "lucide-react";
import { API_BASE } from "@/lib/http";
import { getDisponibilidad } from "@/servicios/citas";
import { getOdontologos } from "@/servicios/usuarios";

type Paciente = {
  id_paciente: number;
  nombres: string;
  apellidos: string;
};

type Doctor = {
  id: number;
  nombres: string;
  apellidos: string;
};

type Consultorio = {
  id_consultorio: number;
  nombre: string;
};

type ClinicaOption = {
  id: number;
  nombre: string;
};

type FormState = {
  id_paciente: string;
  id_odontologo: string;
  id_consultorio: string;
  id_clinica: string;
  fecha: string;
  hora: string;
  observaciones: string;
  estado: string;
};

const initialForm: FormState = {
  id_paciente: "",
  id_odontologo: "",
  id_consultorio: "",
  id_clinica: "",
  fecha: "",
  hora: "",
  observaciones: "",
  estado: "AGENDADA",
};

function isoToHHmm(iso: string) {
  try {
    return new Date(iso).toISOString().slice(11, 16);
  } catch {
    return iso.slice(11, 16);
  }
}

function buildISOWithOffset(fecha: string, hora: string): string {
  if (!fecha || !hora) return "";
  const [y, m, d] = fecha.split("-").map(Number);
  const [hh, mm] = hora.split(":").map(Number);
  const local = new Date(y, m - 1, d, hh, mm, 0);
  const offsetMin = local.getTimezoneOffset();
  const sign = offsetMin > 0 ? "-" : "+";
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

export default function AppointmentEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormState>(initialForm);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [clinicas, setClinicas] = useState<ClinicaOption[]>([]);
  const [duracion, setDuracion] = useState<number>(30);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const horarioRef = useRef<string>("");
  useEffect(() => {
    horarioRef.current = formData.hora;
  }, [formData.hora]);

  const comboRef = useRef<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [pacRes, conRes, citaRes] = await Promise.all([
          fetch(`${API_BASE}/pacientes`),
          fetch(`${API_BASE}/consultorios`),
          fetch(`${API_BASE}/citas/${id}`),
        ]);

        if (!pacRes.ok) throw new Error("No se pudieron cargar pacientes");
        if (!conRes.ok) throw new Error("No se pudieron cargar consultorios");
        if (!citaRes.ok) throw new Error("No se pudo cargar la cita");

        const [pacData, conData, citaData] = await Promise.all([
          pacRes.json().catch(() => ({})),
          conRes.json().catch(() => ({})),
          citaRes.json().catch(() => ({})),
        ]);

        setPacientes(
          Array.isArray(pacData) ? pacData : Array.isArray(pacData?.data) ? pacData.data : []
        );

        setConsultorios(
          Array.isArray(conData) ? conData : Array.isArray(conData?.data) ? conData.data : []
        );

        try {
          const docs = await getOdontologos();
          setDoctores(docs);
        } catch (err) {
          console.error("No se pudieron cargar odontologos:", err);
          setDoctores([]);
        }

        const citaRaw = Array.isArray(citaData) ? citaData[0] : citaData;
        if (citaRaw) {
          const date = new Date(citaRaw.fecha_hora);
          const fecha = date.toISOString().slice(0, 10);
          const hora = date.toTimeString().slice(0, 5);
          const clinicaIdNumeric = Number(
            citaRaw.id_clinica ?? citaRaw.clinica?.id ?? citaRaw.clinica?.id_clinica ?? ""
          );
          const clinicaNombreText =
            citaRaw.clinica?.nombre ??
            citaRaw.clinica?.nombre_clinica ??
            citaRaw.clinica?.alias ??
            "";
          const nextForm: FormState = {
            id_paciente: String(
              citaRaw.id_paciente ?? citaRaw.paciente?.id_paciente ?? ""
            ),
            id_odontologo: String(
              citaRaw.id_odontologo ?? citaRaw.odontologo?.id ?? ""
            ),
            id_consultorio: String(
              citaRaw.id_consultorio ?? citaRaw.consultorio?.id_consultorio ?? ""
            ),
            id_clinica: Number.isFinite(clinicaIdNumeric) && clinicaIdNumeric > 0 ? String(clinicaIdNumeric) : "",
            fecha,
            hora,
            observaciones: citaRaw.observaciones ?? "",
            estado: citaRaw.estado ?? "AGENDADA",
          };
          setFormData(nextForm);
          horarioRef.current = nextForm.hora;
          const estimatedDuracion = Number(
            citaRaw.duracion_minutos ?? citaRaw.duracion ?? 30
          );
          if (Number.isFinite(estimatedDuracion) && estimatedDuracion > 0) {
            setDuracion(estimatedDuracion);
          }
          if (Number.isFinite(clinicaIdNumeric) && clinicaIdNumeric > 0 && clinicaNombreText) {
            setClinicas((prev) => {
              if (prev.some((c) => c.id === clinicaIdNumeric)) return prev;
              return [...prev, { id: clinicaIdNumeric, nombre: clinicaNombreText }];
            });
          }
        }

        try {
          const resClin = await fetch(`${API_BASE}/clinicas`).catch(() => null);
          if (resClin && resClin.ok) {
            const body = await resClin.json().catch(() => ({}));
            const list = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
            const mapped = list
              .map((c: any) => ({
                id: Number(c.id ?? c.id_clinica ?? c.idClinica),
                nombre: c.nombre ?? c.nombre_clinica ?? c.alias ?? `Clinica ${c.id ?? ""}`,
              }))
              .filter((c: ClinicaOption) => Number.isFinite(c.id));
            if (mapped.length) {
              setClinicas((prev) => {
                const merged = [...prev];
                mapped.forEach((clinic) => {
                  if (!merged.some((c) => c.id === clinic.id)) merged.push(clinic);
                });
                return merged;
              });
            }
          }
        } catch (err) {
          console.warn("Clinicas no disponibles:", err);
        }
      } catch (err) {
        console.error("Error cargando datos de cita:", err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  useEffect(() => {
    const { id_consultorio, fecha } = formData;
    if (!id_consultorio || !fecha || !duracion) {
      setSlots([]);
      setSlotsError(null);
      return;
    }

    const comboKey = `${id_consultorio}-${fecha}-${duracion}`;
    const previousKey = comboRef.current;
    comboRef.current = comboKey;

    (async () => {
      setSlotsLoading(true);
      setSlotsError(null);
      try {
        const data = await getDisponibilidad(Number(id_consultorio), fecha, duracion);
        const rawSlots = Array.isArray(data.disponibles) ? data.disponibles : [];
        const hhmmSlots = Array.from(new Set(rawSlots.map(isoToHHmm)));
        const currentHora = horarioRef.current;
        if (currentHora && !hhmmSlots.includes(currentHora)) {
          hhmmSlots.unshift(currentHora);
        }
        setSlots(hhmmSlots);
        if (
          previousKey &&
          previousKey !== comboKey &&
          currentHora &&
          !hhmmSlots.includes(currentHora)
        ) {
          setFormData((prev) => ({ ...prev, hora: "" }));
        }
      } catch (err) {
        setSlots([]);
        setSlotsError((err as Error).message || "No se pudo cargar disponibilidad");
      } finally {
        setSlotsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.id_consultorio, formData.fecha, duracion]);

  const handleChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        id_paciente: Number(formData.id_paciente),
        id_odontologo: Number(formData.id_odontologo),
        id_consultorio: Number(formData.id_consultorio),
        id_clinica: formData.id_clinica ? Number(formData.id_clinica) : undefined,
        fecha_hora: buildISOWithOffset(formData.fecha, formData.hora),
        observaciones: formData.observaciones || null,
        estado: formData.estado || "AGENDADA",
      };
      const res = await fetch(`${API_BASE}/citas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.mensaje || "Error al actualizar cita");
      }
      navigate(`/appointments/${id}`);
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
    }
  };

  const submitDisabled =
    !formData.id_paciente ||
    !formData.id_odontologo ||
    !formData.id_consultorio ||
    !formData.id_clinica ||
    !formData.fecha ||
    !formData.hora;

  if (loading) return <div className="p-4">Cargando datos...</div>;

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
        <h1 className="text-2xl font-bold">Editar Cita #{id}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Editar Consulta
            </CardTitle>
            <CardDescription>Modifica los datos de la cita.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Clinica */}
              <div className="md:col-span-2">
                <Label>Clinica</Label>
                <Select
                  value={formData.id_clinica}
                  onValueChange={(v) => handleChange("id_clinica", v)}
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
              </div>

              {/* Paciente */}
              <div>
                <Label>Paciente</Label>
                <Select
                  value={formData.id_paciente}
                  onValueChange={(v) => handleChange("id_paciente", v)}
                >
                  <SelectTrigger className="w-full">
                    {formData.id_paciente
                      ? (() => {
                          const p = pacientes.find((x) => String(x.id_paciente) === formData.id_paciente);
                          return p ? `${p.nombres} ${p.apellidos}` : "Seleccionar paciente";
                        })()
                      : "Seleccionar paciente"}
                </SelectTrigger>
                <SelectContent>
                    {pacientes.map((p) => (
                      <SelectItem
                        key={p.id_paciente}
                        value={String(p.id_paciente)}
                      >
                        {p.nombres} {p.apellidos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Odontologo */}
              <div>
                <Label>Odontologo</Label>
                <Select
                  value={formData.id_odontologo}
                  onValueChange={(v) => handleChange("id_odontologo", v)}
                >
                  <SelectTrigger className="w-full">
                    {formData.id_odontologo
                      ? (() => {
                          const d = doctores.find((x) => String(x.id) === formData.id_odontologo);
                          return d ? `${d.nombres} ${d.apellidos}` : "Seleccionar medico";
                        })()
                      : "Seleccionar medico"}
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
                  onValueChange={(v) => handleChange("id_consultorio", v)}
                >
                  <SelectTrigger className="w-full">
                    {formData.id_consultorio
                      ? (() => {
                          const c = consultorios.find((x) => String(x.id_consultorio) === formData.id_consultorio);
                          return c ? c.nombre : "Seleccionar consultorio";
                        })()
                      : "Seleccionar consultorio"}
                </SelectTrigger>
                <SelectContent>
                    {consultorios.map((c) => (
                      <SelectItem
                        key={c.id_consultorio}
                        value={String(c.id_consultorio)}
                      >
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
                  onChange={(e) => handleChange("fecha", e.target.value)}
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

              {/* Disponibilidad */}
              <div className="md:col-span-2">
                <Label>Horarios disponibles</Label>
                <Select
                  value={formData.hora}
                  onValueChange={(v) => handleChange("hora", v)}
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
                            : "No hay horarios segun filtros"}
                  </SelectTrigger>
                  <SelectContent>
                    {slots.map((hhmm) => (
                      <SelectItem key={hhmm} value={hhmm}>
                        {hhmm}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {slotsError && (
                  <p className="text-xs text-red-500 mt-1">{slotsError}</p>
                )}
              </div>

              {/* Hora manual */}
              <div>
                <Label>Hora</Label>
                <Input
                  type="time"
                  value={formData.hora}
                  onChange={(e) => handleChange("hora", e.target.value)}
                  required
                />
              </div>

              {/* Observaciones */}
              <div className="md:col-span-2">
                <Label>Observaciones</Label>
                <Textarea
                  value={formData.observaciones}
                  onChange={(e) => handleChange("observaciones", e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="reset"
                variant="secondary"
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitDisabled}>
                Guardar cambios
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";

interface Paciente {
  id_paciente: number;
  nombres: string;
  apellidos: string;
}

interface Doctor {
  id_usuario: number;
  nombres: string;
  apellidos: string;
}

interface Consultorio {
  id_consultorio: number;
  nombre: string;
}

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

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [pacRes, docRes, conRes] = await Promise.all([
          fetch(`/pacientes`),
          fetch(`/usuarios?rol=ODONTOLOGO`),
          fetch(`/consultorios`),
        ]);

        const pacData = await pacRes.json();
        setPacientes(Array.isArray(pacData) ? pacData : pacData.data || []);

        const docData = await docRes.json();
        setDoctores(Array.isArray(docData) ? docData : docData.data || []);

        const conData = await conRes.json();
        setConsultorios(Array.isArray(conData) ? conData : conData.data || []);
      } catch (err) {
        console.error("Error cargando listas:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fechaHoraISO = `${formData.fecha}T${formData.hora}:00`;

      const res = await fetch(`/citas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_paciente: Number(formData.id_paciente),
          id_odontologo: Number(formData.id_odontologo),
          id_consultorio: Number(formData.id_consultorio),
          id_clinica: Number(formData.id_clinica) || null,
          fecha_hora: fechaHoraISO,
          observaciones: formData.observaciones || null,
          estado: "AGENDADA",
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.mensaje || "Error al agendar cita");
      }

      navigate("/appointments");
    } catch (err) {
      console.error("Error creando cita:", err);
      alert((err as Error).message);
    }
  };

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
          <h1 className="text-3xl font-bold text-foreground">
            Agendar Cita Médica
          </h1>
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
                  onValueChange={(value) =>
                    handleSelectChange("id_paciente", value)
                  }
                >
                  <SelectTrigger className="w-full">
                    {formData.id_paciente
                      ? (() => {
                          const p = pacientes.find(
                            (p) =>
                              String(p.id_paciente) === formData.id_paciente
                          );
                          return p
                            ? `${p.nombres} ${p.apellidos}`
                            : "Seleccionar paciente";
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

              {/* Médico */}
              <div>
                <Label>Médico</Label>
                <Select
                  value={formData.id_odontologo}
                  onValueChange={(value) =>
                    handleSelectChange("id_odontologo", value)
                  }
                >
                  <SelectTrigger className="w-full">
                    {formData.id_odontologo
                      ? (() => {
                          const d = doctores.find(
                            (d) =>
                              String(d.id_usuario) === formData.id_odontologo
                          );
                          return d
                            ? `${d.nombres} ${d.apellidos}`
                            : "Seleccionar médico";
                        })()
                      : "Seleccionar médico"}
                  </SelectTrigger>
                  <SelectContent>
                    {doctores.map((d) => (
                      <SelectItem
                        key={d.id_usuario}
                        value={String(d.id_usuario)}
                      >
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
                  onValueChange={(value) =>
                    handleSelectChange("id_consultorio", value)
                  }
                >
                  <SelectTrigger className="w-full">
                    {formData.id_consultorio
                      ? (() => {
                          const c = consultorios.find(
                            (c) =>
                              String(c.id_consultorio) ===
                              formData.id_consultorio
                          );
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
                  onChange={(e) =>
                    handleSelectChange("fecha", e.target.value)
                  }
                  required
                />
              </div>

              {/* Hora */}
              <div>
                <Label>Hora</Label>
                <Input
                  type="time"
                  value={formData.hora}
                  onChange={(e) =>
                    handleSelectChange("hora", e.target.value)
                  }
                  required
                />
              </div>

              {/* Observaciones */}
              <div className="md:col-span-2">
                <Label>Observaciones</Label>
                <Textarea
                  value={formData.observaciones}
                  onChange={(e) =>
                    handleSelectChange("observaciones", e.target.value)
                  }
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
              <Button type="submit">Agendar Cita</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default NewAppointmentForm;

// src/pages/AppointmentEdit.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
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
import { ArrowLeft, User, Lock } from "lucide-react";

interface Paciente {
  id_paciente: number;
  nombres: string;
  apellidos: string;
}

interface Doctor {
  id: number;
  nombres: string;
  apellidos: string;
  rol: { id_rol: number; nombre_rol: string };
}

interface Consultorio {
  id_consultorio: number;
  nombre: string;
}

const ODONTOLOGO_ROLE_ID = 2; // el id de rol para odontólogo

export default function AppointmentEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    id_paciente: "",
    id_odontologo: "",
    id_consultorio: "",
    fecha: "",
    hora: "",
    observaciones: "",
  });
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Patient data passed from detail view
  const patientData = location.state?.patientData;

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        console.log("Cargando datos para editar cita:", id);
        
        const [rPac, rUsers, rCon, rCita] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/pacientes`),
          fetch(`${import.meta.env.VITE_API_URL}/usuarios`),
          fetch(`${import.meta.env.VITE_API_URL}/consultorios`),
          fetch(`${import.meta.env.VITE_API_URL}/citas/${id}`),
        ]);
        
        // Verificar que todas las respuestas sean exitosas
        if (!rPac.ok || !rUsers.ok || !rCon.ok || !rCita.ok) {
          throw new Error("Error al cargar datos de la API");
        }
        
        const [pacData, usersData, conData, citaData] = await Promise.all([
          rPac.json(),
          rUsers.json(),
          rCon.json(),
          rCita.json(),
        ]);

        console.log("Datos cargados:", { pacData, usersData, conData, citaData });

        // Pacientes
        const pacientesArray = Array.isArray(pacData) ? pacData : pacData.data || [];
        setPacientes(pacientesArray);
        console.log("Pacientes cargados:", pacientesArray.length);

        // Consultorios
        const consultoriosArray = Array.isArray(conData) ? conData : conData.data || [];
        setConsultorios(consultoriosArray);
        console.log("Consultorios cargados:", consultoriosArray.length);

        // Doctores: filtrar por rol.id_rol === ODONTOLOGO_ROLE_ID
        const usersArray = Array.isArray(usersData)
          ? usersData
          : usersData.data || usersData.usuarios || [];
        const odontologos = (usersArray as any[])
          .filter((u) => u.rol?.id_rol === ODONTOLOGO_ROLE_ID)
          .map((u) => ({
            id: u.id,
            nombres: u.nombres,
            apellidos: u.apellidos,
            rol: u.rol,
          }));
        setDoctores(odontologos);
        console.log("Odontólogos cargados:", odontologos.length);

        // Cita existente
        const cita = Array.isArray(citaData) ? citaData[0] : citaData;
        if (cita) {
          const dt = new Date(cita.fecha_hora);
          setFormData({
            id_paciente: String(cita.id_paciente),
            id_odontologo: String(cita.id_odontologo),
            id_consultorio: String(cita.id_consultorio),
            fecha: dt.toISOString().slice(0, 10),
            hora: dt.toTimeString().slice(0, 5),
            observaciones: cita.observaciones || "",
          });
          console.log("Datos de cita cargados:", cita);
        }
        
        // Si hay datos del paciente pasados desde el detalle, asegurar que el formData tenga el ID correcto
        if (patientData && patientData.id_paciente) {
          setFormData(prev => ({
            ...prev,
            id_paciente: String(patientData.id_paciente)
          }));
          console.log("Datos del paciente desde detalle:", patientData);
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, patientData]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        id_paciente: Number(formData.id_paciente),
        id_odontologo: Number(formData.id_odontologo),
        id_consultorio: Number(formData.id_consultorio),
        fecha_hora: `${formData.fecha}T${formData.hora}:00`,
        observaciones: formData.observaciones || null,
        estado: "AGENDADA",
      };
      const res = await fetch(`${import.meta.env.VITE_API_URL}/citas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.mensaje || "Error al actualizar cita");
      }
      // Navegar al detalle de la cita como modal, manteniendo el background
      navigate(`/appointments/${id}`, { 
        state: { 
          background: location.state?.background ?? location,
          patientData: patientData 
        } 
      });
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
    }
  };

  if (loading) return <div className="p-4">Cargando datos de la cita…</div>;
  
  if (error) return (
    <div className="p-4">
      <div className="text-red-600 mb-4">Error: {error}</div>
      <Button onClick={() => navigate(-1)}>Volver</Button>
    </div>
  );

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
              {/* Paciente */}
              <div>
                <Label className="flex items-center gap-2">
                  Paciente
                  {patientData && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Solo lectura
                    </span>
                  )}
                </Label>
                {patientData ? (
                  // Mostrar paciente en modo de solo lectura cuando viene del detalle
                  <Input
                    value={`${patientData.nombres} ${patientData.apellidos} (${patientData.tipo_documento}: ${patientData.documento_identidad})`}
                    disabled
                    className="w-full bg-gray-50 dark:bg-gray-800"
                  />
                ) : (
                  // Selector normal cuando no hay datos del paciente
                  <Select
                    value={formData.id_paciente}
                    onValueChange={(v) => handleChange("id_paciente", v)}
                  >
                    <SelectTrigger className="w-full">
                      {formData.id_paciente
                        ? pacientes.find((p) => String(p.id_paciente) === formData.id_paciente)?.nombres + " " +
                          pacientes.find((p) => String(p.id_paciente) === formData.id_paciente)?.apellidos
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
                )}
              </div>

              {/* Odontólogo */}
              <div>
                <Label className="flex items-center gap-2">
                  Odontólogo
                  <span className="text-xs text-gray-500">
                    ({doctores.length} disponibles)
                  </span>
                </Label>
                <Select
                  value={formData.id_odontologo}
                  onValueChange={(v) => handleChange("id_odontologo", v)}
                >
                  <SelectTrigger className="w-full">
                    {formData.id_odontologo
                      ? doctores.find((d) => String(d.id) === formData.id_odontologo)?.nombres + " " +
                        doctores.find((d) => String(d.id) === formData.id_odontologo)?.apellidos
                      : doctores.length > 0 ? "Seleccionar médico" : "Cargando médicos..."}
                  </SelectTrigger>
                  <SelectContent>
                    {doctores.length > 0 ? (
                      doctores.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.nombres} {d.apellidos}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        No hay médicos disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Consultorio */}
              <div>
                <Label className="flex items-center gap-2">
                  Consultorio
                  <span className="text-xs text-gray-500">
                    ({consultorios.length} disponibles)
                  </span>
                </Label>
                <Select
                  value={formData.id_consultorio}
                  onValueChange={(v) => handleChange("id_consultorio", v)}
                >
                  <SelectTrigger className="w-full">
                    {formData.id_consultorio
                      ? consultorios.find((c) => String(c.id_consultorio) === formData.id_consultorio)?.nombre
                      : consultorios.length > 0 ? "Seleccionar consultorio" : "Cargando consultorios..."}
                  </SelectTrigger>
                  <SelectContent>
                    {consultorios.length > 0 ? (
                      consultorios.map((c) => (
                        <SelectItem
                          key={c.id_consultorio}
                          value={String(c.id_consultorio)}
                        >
                          {c.nombre}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        No hay consultorios disponibles
                      </SelectItem>
                    )}
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

              {/* Hora */}
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
              <Button type="submit">Guardar cambios</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

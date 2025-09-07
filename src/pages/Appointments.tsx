import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, CalendarPlus, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";

interface Appointment {
  id_cita: number;
  paciente: { nombres: string; apellidos: string };
  odontologo: { nombres: string; apellidos: string };
  consultorio: { nombre: string };
  estado: string;
  fecha_hora: string;
}

const Appointments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/citas`);
        const data = await res.json();
        //const res = await axios.get<Appointment[]>("http://localhost:3000/api/citas");
        setAppointments(data);
      } catch (err) {
        console.error("Error al cargar citas:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const filteredAppointments = appointments.filter((a) => {
    const fullPatient = `${a.paciente?.nombres ?? ""} ${a.paciente?.apellidos ?? ""}`.toLowerCase();
    const fullDoctor = `${a.odontologo?.nombres ?? ""} ${a.odontologo?.apellidos ?? ""}`.toLowerCase();
    return (
      fullPatient.includes(searchTerm.toLowerCase()) ||
      fullDoctor.includes(searchTerm.toLowerCase())
    );
  });

  if (loading) return <p>Cargando citas...</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Citas Médicas</h1>
          <p className="text-muted-foreground">Listado de citas agendadas</p>
        </div>
        <Link to="/appointments/new">
          <Button className="flex items-center gap-2">
            <CalendarPlus className="h-4 w-4" />
            Nueva Cita
          </Button>
        </Link>
      </div>

      {/* Buscador */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por paciente o médico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de citas */}
      <div className="grid gap-4">
        {filteredAppointments.map((appointment) => {
          const dateObj = new Date(appointment.fecha_hora);
          return (
            <Card key={appointment.id_cita} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {`${appointment.paciente?.nombres ?? ""} ${appointment.paciente?.apellidos ?? ""}`}
                      </h3>
                      <Badge
                        variant={
                          appointment.estado === "CONFIRMADA"
                            ? "default"
                            : appointment.estado === "AGENDADA"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {appointment.estado}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Médico:</span>{" "}
                        {`${appointment.odontologo?.nombres ?? ""} ${appointment.odontologo?.apellidos ?? ""}`}
                      </div>
                      <div>
                        <span className="font-medium">Fecha:</span>{" "}
                        {dateObj.toLocaleDateString()} - {dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Link to={`/appointments/${appointment.id_cita}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAppointments.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No se encontraron citas que coincidan con la búsqueda.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Appointments;
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, CalendarPlus, Eye } from "lucide-react";
import { Link } from "react-router-dom";

const Appointments = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Datos de ejemplo
  const appointments = [
    {
      id: "1",
      patientName: "María González Pérez",
      date: "2025-07-25",
      time: "10:00",
      specialty: "Pediatría",
      doctor: "Dra. Elena Ruiz",
      status: "Confirmada",
    },
    {
      id: "2",
      patientName: "Carlos Rodríguez López",
      date: "2025-07-26",
      time: "11:30",
      specialty: "Medicina General",
      doctor: "Dr. Luis Méndez",
      status: "Pendiente",
    },
    {
      id: "3",
      patientName: "Ana Martínez Silva",
      date: "2025-07-27",
      time: "09:00",
      specialty: "Odontología",
      doctor: "Dra. Paula Torres",
      status: "Cancelada",
    },
  ];

  const filteredAppointments = appointments.filter(
    (a) =>
      a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              placeholder="Buscar por paciente, médico o especialidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Citas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{appointments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {appointments.filter((a) => a.status === "Confirmada").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {appointments.filter((a) => a.status === "Pendiente").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de citas */}
      <div className="grid gap-4">
        {filteredAppointments.map((appointment) => (
          <Card
            key={appointment.id}
            className="hover:shadow-md transition-shadow"
          >
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {appointment.patientName}
                    </h3>
                    <Badge
                      variant={
                        appointment.status === "Confirmada"
                          ? "default"
                          : appointment.status === "Pendiente"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {appointment.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Especialidad:</span>{" "}
                      {appointment.specialty}
                    </div>
                    <div>
                      <span className="font-medium">Médico:</span>{" "}
                      {appointment.doctor}
                    </div>
                    <div>
                      <span className="font-medium">Fecha:</span>{" "}
                      {appointment.date} - {appointment.time}
                    </div>
                  </div>
                </div>
                <div>
                  <Link to={`/appointments/${appointment.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAppointments.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No se encontraron citas que coincidan con la búsqueda.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Appointments;

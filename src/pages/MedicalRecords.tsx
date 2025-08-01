import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Eye, Edit, Calendar, User } from "lucide-react";
import { Link } from "react-router-dom";

const MedicalRecords = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Datos de ejemplo de historias clínicas
  const medicalRecords = [
    {
      id: "1",
      patientName: "María González Pérez",
      patientId: "1",
      date: "2024-01-15",
      type: "Consulta General",
      diagnosis: "Hipertensión arterial leve",
      doctor: "Dr. Roberto Méndez",
      status: "Completado",
      symptoms: "Dolor de cabeza, mareos ocasionales",
      treatment: "Medicación antihipertensiva, cambios en dieta",
    },
    {
      id: "2",
      patientName: "Carlos Rodríguez López",
      patientId: "2",
      date: "2024-01-10",
      type: "Consulta Especializada",
      diagnosis: "Gastritis crónica",
      doctor: "Dra. Ana Morales",
      status: "En seguimiento",
      symptoms: "Dolor abdominal, acidez estomacal",
      treatment: "Omeprazol, dieta blanda",
    },
    {
      id: "3",
      patientName: "Ana Martínez Silva",
      patientId: "3",
      date: "2023-12-20",
      type: "Control de Rutina",
      diagnosis: "Diabetes tipo 2 controlada",
      doctor: "Dr. Luis Castillo",
      status: "Completado",
      symptoms: "Control de glucosa",
      treatment: "Metformina, ejercicio regular",
    },
    {
      id: "4",
      patientName: "Juan Pérez Morales",
      patientId: "4",
      date: "2024-01-12",
      type: "Emergencia",
      diagnosis: "Infarto agudo de miocardio",
      doctor: "Dr. Patricia López",
      status: "Crítico",
      symptoms: "Dolor torácico intenso, dificultad respiratoria",
      treatment: "Angioplastia, medicación cardiovascular",
    },
  ];

  const filteredRecords = medicalRecords.filter(record =>
    record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completado":
        return <Badge variant="default" className="bg-green-500">Completado</Badge>;
      case "En seguimiento":
        return <Badge variant="secondary">En seguimiento</Badge>;
      case "Crítico":
        return <Badge variant="destructive">Crítico</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "Emergencia":
        return <Badge variant="destructive">{type}</Badge>;
      case "Consulta Especializada":
        return <Badge className="bg-blue-500">{type}</Badge>;
      case "Control de Rutina":
        return <Badge variant="secondary">{type}</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Historias Clínicas</h1>
          <p className="text-muted-foreground">
            Gestiona todas las historias clínicas y registros médicos
          </p>
        </div>
        <Link to="/medical-records/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nueva Historia Clínica
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por paciente, diagnóstico, doctor o tipo de consulta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Historias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{medicalRecords.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {medicalRecords.filter(r => r.status === "Completado").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">En Seguimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {medicalRecords.filter(r => r.status === "En seguimiento").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Críticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {medicalRecords.filter(r => r.status === "Crítico").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medical Records List */}
      <div className="grid gap-4">
        {filteredRecords.map((record) => (
          <Card key={record.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-semibold text-foreground">
                      {record.patientName}
                    </h3>
                    {getStatusBadge(record.status)}
                    {getTypeBadge(record.type)}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Fecha:</span> {record.date}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="font-medium">Doctor:</span> {record.doctor}
                    </div>
                    <div className="text-muted-foreground">
                      <span className="font-medium">ID:</span> #{record.id}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="font-medium text-foreground">Diagnóstico:</span>
                      <span className="text-muted-foreground ml-2">{record.diagnosis}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-foreground">Síntomas:</span>
                      <span className="text-muted-foreground ml-2">{record.symptoms}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-foreground">Tratamiento:</span>
                      <span className="text-muted-foreground ml-2">{record.treatment}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Link to={`/medical-records/${record.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </Link>
                  <Link to={`/medical-records/${record.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </Link>
                  <Link to={`/patients/${record.patientId}`}>
                    <Button size="sm">
                      <User className="h-4 w-4 mr-1" />
                      Paciente
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRecords.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No se encontraron historias clínicas que coincidan con la búsqueda.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MedicalRecords;
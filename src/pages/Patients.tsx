// src/pages/Patients.tsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Eye, Edit, FileText } from "lucide-react";
import { Link } from "react-router-dom";

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  lastVisit: string;
  status: "Activo" | "Inactivo";
  medicalRecords: number;
}

const calculateAge = (dob: string): number => {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const Patients: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchPacientes() {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/pacientes?page=${page}&limit=${limit}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        // Extraer listado
        const list = Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.pacientes)
            ? json.pacientes
            : Array.isArray(json)
              ? json
              : [];
        // Mapear a Patient
        const mapped: Patient[] = list.map((r: any) => ({
          id: String(r.id_paciente || r.id),
          name: `${r.nombres || r.name} ${r.apellidos || ''}`.trim(),
          age: calculateAge(r.fecha_nacimiento || r.lastVisit),
          gender: (r.sexo || r.gender || '').toString().toLowerCase().replace(/^./, str => str.toUpperCase()),
          phone: r.telefono || r.phone,
          email: r.correo || r.email,
          lastVisit: r.fecha_nacimiento || r.lastVisit,
          status: r.activo ? "Activo" : "Inactivo",
          medicalRecords: r.medicalRecords ?? 0,
        }));
        setPatients(mapped);
        setTotalPages(json.totalPages || 1);
        setError(null);
      } catch (err) {
        console.error(err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchPacientes();
  }, [page]);

  const term = searchTerm.toLowerCase();
  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(term) ||
    p.phone.toLowerCase().includes(term) ||
    p.email.toLowerCase().includes(term)
  );

  if (loading) return <div className="p-4">Cargando pacientes…</div>;
  if (error) return <div className="p-4 text-red-600">Error al cargar pacientes: {error}</div>;

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Pacientes</h1>
          <p className="text-muted-foreground">Gestiona los registros de todos los pacientes</p>
        </div>
        <Link to="/patients/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Nuevo Paciente
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pacientes por nombre, teléfono o email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{patients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pacientes Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{patients.filter(p => p.status === "Activo").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Historias Clínicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-medical-green">{patients.reduce((sum, p) => sum + p.medicalRecords, 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Patients List */}
      <div className="grid gap-4">
        {filtered.map(patient => (
          <Card key={patient.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{patient.name}</h3>
                    <Badge variant={patient.status === "Activo" ? "default" : "secondary"}>{patient.status}</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground">
                    <div><strong>Edad:</strong> {patient.age} años</div>
                    <div><strong>Género:</strong> {patient.gender}</div>
                    <div><strong>Teléfono:</strong> {patient.phone}</div>
                    <div><strong>Email:</strong> {patient.email}</div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div><strong>Última visita:</strong> {patient.lastVisit}</div>
                    <div><strong>Historias clínicas:</strong> {patient.medicalRecords}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/patients/${patient.id}`}><Button variant="outline" size="sm"><Eye /></Button></Link>
                  <Link to={`/patients/${patient.id}/edit`}><Button variant="outline" size="sm"><Edit /></Button></Link>
                  <Link to={`/medical-records/new?patientId=${patient.id}`}><Button size="sm"><FileText /></Button></Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      if (window.confirm("¿Estás seguro de eliminar este paciente?")) {
                        try {
                          const res = await fetch(`${import.meta.env.VITE_API_URL}/pacientes/${patient.id}`, {
                            method: "DELETE"
                          });
                          if (!res.ok) throw new Error(`HTTP ${res.status}`);
                          alert("Paciente eliminado correctamente");
                          setPatients(p => p.filter(x => x.id !== patient.id));
                        } catch (err) {
                          alert("Error al eliminar paciente");
                          console.error(err);
                        }
                      }
                    }}
                  >
                    🗑️
                  </Button>
                </div>

              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <Card><CardContent className="pt-6 text-center"><p className="text-muted-foreground">No se encontraron pacientes.</p></CardContent></Card>}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center space-x-4 mt-6">
        <Button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>Anterior</Button>
        <span className="text-sm">Página {page} de {totalPages}</span>
        <Button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}>Siguiente</Button>
      </div>
    </div>
  );
};

export default Patients;

// src/pages/Patients.tsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Eye, Edit, FileText, Calendar, X, Check } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { apiGet, apiDelete } from "@/api/client";
import PatientDetailModal from "@/components/PatientDetailModal";
import PatientEditModal from "@/components/PatientEditModal";

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  lastVisit: string;
  status: "Activo" | "Inactivo";
  occupation: string;
  medicalRecords: number;
}

const calculateAge = (dob: string): number => {
  if (!dob) return 0;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return isNaN(age) ? 0 : age;
};

const Patients: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [totalBackend, setTotalBackend] = useState(0);

  // Estados para selección múltiple y modales
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    async function fetchPacientes() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });

        if (mostrarInactivos) {
          params.set("withDeleted", "true");
          params.set("onlyInactive", "true");
        }

        const json = await apiGet<any>("/pacientes", Object.fromEntries(params.entries()));

        setTotalBackend(json.total || 0);
        setTotalPages(json.totalPages || 1);

        const list = Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.pacientes)
          ? json.pacientes
          : Array.isArray(json)
          ? json
          : [];

        const mapped: Patient[] = list.map((r: any) => ({
          id: String(r.id_paciente || r.id),
          name: `${r.nombres || r.name || ""} ${r.apellidos || ""}`.trim(),
          age: calculateAge(r.fecha_nacimiento || ""),
          gender: (r.sexo || r.gender || "")
            .toString()
            .toLowerCase()
            .replace(/^./, (s: string) => s.toUpperCase()),
          phone: r.telefono || r.phone || "",
          email: r.correo || r.email || "",
          lastVisit: r.fecha_nacimiento || r.lastVisit || "",
          status: r.activo ? "Activo" : "Inactivo",
          occupation: r.ocupacion || "",          clinic: r.clinica?.nombre ?? r.nombre_clinica ?? r.clinica_nombre ?? "",
          tenant: r.tenant?.nombre ?? r.tenant?.slug ?? r.clinica?.tenant?.nombre ?? r.clinica?.tenant?.slug ?? "",
          medicalRecords: r.medicalRecords ?? 0,
        }));

        setPatients(mapped);
        setError(null);
      } catch (err) {
        console.error(err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchPacientes();
  }, [page, mostrarInactivos]);

  // Actualizar la URL cuando cambia la búsqueda
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (searchTerm) {
      params.set("search", searchTerm);
    } else {
      params.delete("search");
    }
    setSearchParams(params, { replace: true });
  }, [searchTerm, searchParams, setSearchParams]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const togglePatientSelection = (patientId: string) => {
    setSelectedPatients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(patientId)) {
        newSet.delete(patientId);
      } else {
        newSet.add(patientId);
      }
      return newSet;
    });
  };

  const clearSelections = () => setSelectedPatients(new Set());
  const selectAllVisible = (filtered: Patient[]) =>
    setSelectedPatients(new Set(filtered.map((p) => p.id)));

  const openPatientModal = (id: string) => {
    setSelectedPatientId(id);
    setIsModalOpen(true);
  };
  const closePatientModal = () => {
    setSelectedPatientId(null);
    setIsModalOpen(false);
  };
  const openEditModal = (id: string) => {
    setEditingPatientId(id);
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    setEditingPatientId(null);
    setIsEditModalOpen(false);
  };
  const handlePatientDeleted = (id: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== id));
    setSelectedPatients((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };
  const handlePatientUpdated = (updated: any) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, name: updated.name } : p))
    );
  };

  const term = searchTerm.toLowerCase();
  const filtered = patients.filter(
    (p) =>
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
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pacientes por nombre, teléfono o email..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  onClick={() => handleSearchChange("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {filtered.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectAllVisible(filtered)}
                    disabled={selectedPatients.size === filtered.length}
                  >
                    <Check className="h-4 w-4 mr-1" /> Seleccionar Todos
                  </Button>
                  {selectedPatients.size > 0 && (
                    <Button variant="outline" size="sm" onClick={clearSelections}>
                      <X className="h-4 w-4 mr-1" /> Limpiar ({selectedPatients.size})
                    </Button>
                  )}
                </div>
                {selectedPatients.size > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {selectedPatients.size} paciente
                    {selectedPatients.size !== 1 ? "s" : ""} seleccionado
                    {selectedPatients.size !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Total Pacientes {mostrarInactivos ? "(inactivos)" : "(activos)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalBackend}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">En esta página</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{filtered.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Historias Clínicas (página)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-medical-green">
              {filtered.reduce((sum, p) => sum + p.medicalRecords, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toggle Button */}
      <div className="flex justify-end">
        <Button
          variant={mostrarInactivos ? "default" : "secondary"}
          onClick={() => {
            setPage(1);
            setMostrarInactivos((v) => !v);
          }}
        >
          {mostrarInactivos ? "👁️ Ver Activos" : "🗂️ Ver Inactivos"}
        </Button>
      </div>

      {/* Patients List */}
      <div className="grid gap-4">
        {filtered.map((patient) => {
          const isSelected = selectedPatients.has(patient.id);
          return (
            <Card
              key={patient.id}
              className={`hover:shadow-md transition-all cursor-pointer ${
                isSelected ? "ring-2 ring-primary bg-primary/5 border-primary" : ""
              }`}
              onClick={() => togglePatientSelection(patient.id)}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <h3 className="text-lg font-semibold">{patient.name}</h3>
                      </div>
                      <Badge variant={patient.status === "Activo" ? "default" : "secondary"}>
                        {patient.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground">
                      <div><strong>Edad:</strong> {patient.age} años</div>
                      <div><strong>Género:</strong> {patient.gender}</div>
                      <div><strong>Teléfono:</strong> {patient.phone}</div>
                      <div><strong>Email:</strong> {patient.email}</div>
                      <div><strong>Clinica:</strong> {patient.clinic || "Sin clinica"}</div>
                      <div><strong>Tenant:</strong> {patient.tenant || "Sin tenant"}</div>
                      <div><strong>Ocupación:</strong> {patient.occupation || "No registrada"}</div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div><strong>Última visita:</strong> {patient.lastVisit}</div>
                      <div><strong>Historias clínicas:</strong> {patient.medicalRecords}</div>
                    </div>
                  </div>

                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" onClick={() => openPatientModal(patient.id)}>
                      <Eye />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditModal(patient.id)}>
                      <Edit />
                    </Button>
                    <Link to={`/medical-records/new?patientId=${patient.id}`}>
                      <Button size="sm"><FileText /></Button>
                    </Link>
                    <Link to={`/appointments?id_paciente=${patient.id}`}>
                      <Button size="sm"><Calendar /></Button>
                    </Link>

                    {!mostrarInactivos && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm("¿Estas seguro de eliminar este paciente?")) {
                            try {
                              await apiDelete(`/pacientes/${patient.id}`);
                              setPatients((p) => p.filter((x) => x.id !== patient.id));
                            } catch (err) {
                              alert("Error al eliminar paciente");
                              console.error(err);
                            }
                          }
                        }}
                      >
                        🗑️
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No se encontraron pacientes.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center space-x-4 mt-6">
        <Button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>
          Anterior
        </Button>
        <span className="text-sm">
          Página {page} de {totalPages}
        </span>
        <Button onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages}>
          Siguiente
        </Button>
      </div>

      {/* Modals */}
      <PatientDetailModal
        patientId={selectedPatientId}
        isOpen={isModalOpen}
        onClose={closePatientModal}
        onPatientDeleted={handlePatientDeleted}
        onEditPatient={openEditModal}
      />
      <PatientEditModal
        patientId={editingPatientId}
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onPatientUpdated={handlePatientUpdated}
      />
    </div>
  );
};

export default Patients;

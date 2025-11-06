import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Calendar,
  FileText,
  Loader2,
  Plus,
  Search,
  User,
  Building2,
  AlertCircle,
} from "lucide-react";
import PatientSearchModal from "@/components/PatientSearchModal";
import { fetchHistoriasPorPaciente } from "@/lib/api/historiasClinicas";
import type { HistoriaClinica } from "@/types/historiaClinica";
import { apiGet } from "@/api/client";
import {
  abrirDraftOdontograma,
  getOdontogramaByHistoria,
  OdontogramaResponse,
} from "@/lib/api/odontograma";
import OdontogramaModal from "@/components/OdontogramaModal";

type SelectedPatient = {
  id_paciente: number;
  nombres?: string;
  apellidos?: string;
  numero_cedula?: string;
  numero_celular?: string;
  email?: string;
};

const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return dateString;
  }
};

const MedicalRecords = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<SelectedPatient | null>(null);
  const [histories, setHistories] = useState<HistoriaClinica[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<number | null>(null);
  const [historiesLoading, setHistoriesLoading] = useState(false);
  const [historiesError, setHistoriesError] = useState<string | null>(null);

  // Odontograma modal state
  const [selectedHistoriaId, setSelectedHistoriaId] = useState<number | null>(null);
  const [ogData, setOgData] = useState<OdontogramaResponse | null>(null);
  const [ogLoading, setOgLoading] = useState(false);
  const [ogError, setOgError] = useState<string | null>(null);
  const [ogModalOpen, setOgModalOpen] = useState(false);

  const openOdontogramaModal = useCallback(
    async (historiaId: number, mode: "empty" | "from_last") => {
      setSelectedHistoriaId(historiaId);
      setOgModalOpen(true);
      setOgError(null);
      setOgLoading(true);
      setOgData(null);
      try {
        const res = await abrirDraftOdontograma(historiaId, mode);
        setOgData(res);
      } catch (e: any) {
        const message =
          e?.message ||
          (mode === "from_last"
            ? "Error al abrir odontograma (desde último)"
            : "Error al abrir odontograma");
        setOgError(message);
        toast.error(message);
      } finally {
        setOgLoading(false);
      }
    },
    [],
  );

  const ensureDraftDraft = useCallback(async () => {
    if (!selectedHistoriaId) return;
    setOgError(null);
    setOgLoading(true);
    try {
      const draft = await abrirDraftOdontograma(selectedHistoriaId, "from_last");
      setOgData(draft);
    } catch (e: any) {
      const message = e?.message || "No se pudo abrir el borrador del odontograma";
      setOgError(message);
      toast.error(message);
      throw e;
    } finally {
      setOgLoading(false);
    }
  }, [selectedHistoriaId]);

  const reloadOdontograma = useCallback(
    async (showToast = false) => {
      if (!selectedHistoriaId) return;
      setOgError(null);
      setOgLoading(true);
      try {
        const snapshot = await getOdontogramaByHistoria(selectedHistoriaId);
        setOgData(snapshot);
      } catch (e: any) {
        const message = e?.message || "No se pudo recargar el odontograma";
        setOgError(message);
        if (showToast) toast.error(message);
      } finally {
        setOgLoading(false);
      }
    },
    [selectedHistoriaId],
  );

  const handlePatientSelected = useCallback((patient: SelectedPatient) => {
    setSelectedPatient(patient);
    setPatientModalOpen(false);
  }, []);

  const idPacienteParam = searchParams.get("id_paciente");

  useEffect(() => {
    if (selectedPatient || !idPacienteParam) return;
    const parsedId = Number(idPacienteParam);
    if (!Number.isFinite(parsedId) || parsedId <= 0) return;

    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<any>(`/pacientes/${parsedId}`);
        if (cancelled || !data) return;
        const patient: SelectedPatient = {
          id_paciente: Number(data.id_paciente ?? data.id ?? parsedId),
          nombres: data.nombres ?? data.nombre ?? "",
          apellidos: data.apellidos ?? data.apellido ?? "",
          numero_cedula: data.numero_cedula ?? data.identificacion ?? data.documento_identidad,
          numero_celular: data.numero_celular ?? data.telefono ?? data.celular,
          email: data.email ?? data.correo ?? "",
        };
        setSelectedPatient(patient);
      } catch (error: any) {
        toast.error(
          error?.message || "No se pudo obtener la información del paciente seleccionado",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [idPacienteParam, selectedPatient]);

const activeHistory = useMemo(
  () => histories.find((history) => history.id_historia === activeHistoryId) ?? null,
  [histories, activeHistoryId],
);

  const handleClearSelection = useCallback(() => {
    setSelectedPatient(null);
    setHistories([]);
    setActiveHistoryId(null);
    setHistoriesError(null);
    setHistoriesLoading(false);
  }, []);

const loadHistories = useCallback(async () => {
  if (!selectedPatient) return;
  setHistoriesLoading(true);
  setHistoriesError(null);
  try {
      const items = await fetchHistoriasPorPaciente(selectedPatient.id_paciente);
      setHistories(items);
      setActiveHistoryId(items[0]?.id_historia ?? null);
    } catch (error: any) {
      const message =
        error?.status === 403
          ? "Acceso denegado: el paciente pertenece a otro tenant"
          : error?.message || "No se pudieron cargar las historias clínicas del paciente";
      setHistoriesError(message);
      toast.error(message);
    } finally {
      setHistoriesLoading(false);
    }
  }, [selectedPatient]);

  useEffect(() => {
    if (!selectedPatient) {
      setHistories([]);
      setActiveHistoryId(null);
      setHistoriesLoading(false);
      setHistoriesError(null);
      return;
    }
    void loadHistories();
  }, [selectedPatient, loadHistories]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Historias Clínicas</h1>
          <p className="text-muted-foreground">
            Busca pacientes y gestiona sus historias médicas en un solo lugar.
          </p>
        </div>
        <Link
          to={
            selectedPatient
              ? `/medical-records/new?patientId=${selectedPatient.id_paciente}`
              : "/medical-records/new"
          }
          state={{ background: location }}
        >
          <Button className="flex items-center gap-2" disabled={!selectedPatient}>
            <Plus className="h-4 w-4" />
            Nueva historia
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-md border p-2 bg-muted/40">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Paciente seleccionado
                </p>
                {selectedPatient ? (
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-foreground">
                      {selectedPatient.nombres} {selectedPatient.apellidos}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {selectedPatient.numero_cedula && (
                        <Badge variant="secondary">
                          Cédula: {selectedPatient.numero_cedula}
                        </Badge>
                      )}
                      {selectedPatient.numero_celular && (
                        <Badge variant="secondary">
                          Teléfono: {selectedPatient.numero_celular}
                        </Badge>
                      )}
                      {selectedPatient.email && (
                        <Badge variant="secondary">Correo: {selectedPatient.email}</Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Selecciona un paciente para revisar su historial clínico.
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {selectedPatient && (
                <Button variant="ghost" onClick={handleClearSelection}>
                  Limpiar selección
                </Button>
              )}
              <Button onClick={() => setPatientModalOpen(true)}>Buscar paciente</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedPatient ? (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">
                Historias ({histories.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {historiesLoading && (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cargando historias...
                </div>
              )}
              {historiesError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <span>{historiesError}</span>
                </div>
              )}
              {!historiesLoading && histories.length === 0 && (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Este paciente aún no tiene historias clínicas registradas.
                </div>
              )}
              <div className="space-y-2">
                {histories.map((history) => {
                  const isActive = history.id_historia === activeHistoryId;
                  return (
                    <button
                      key={history.id_historia}
                      type="button"
                      onClick={() => setActiveHistoryId(history.id_historia)}
                      className={`w-full rounded-md border p-3 text-left transition ${
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/60 hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Historia #{history.id_historia}</span>
                        {history.fecha_creacion && (
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(history.fecha_creacion)}
                          </span>
                        )}
                      </div>
                      {history.clinica?.nombre && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {history.clinica.nombre}
                        </p>
                      )}
                      {history.detalles_generales && (
                        <p className="text-xs line-clamp-2 mt-1 text-muted-foreground">
                          {history.detalles_generales}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {activeHistory ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    Historia #{activeHistory.id_historia}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium text-foreground">Paciente:</span>
                      <span>
                        {selectedPatient.nombres} {selectedPatient.apellidos} (#
                        {activeHistory.id_paciente})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium text-foreground">Clínica:</span>
                      <span>{activeHistory.clinica?.nombre ?? "Sin clínica"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium text-foreground">Creación:</span>
                      <span>{formatDateTime(activeHistory.fecha_creacion)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium text-foreground">Última actualización:</span>
                      <span>{formatDateTime(activeHistory.fecha_modificacion)}</span>
                    </div>
                  </div>

                  {activeHistory.detalles_generales && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">Detalles</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {activeHistory.detalles_generales}
                        </p>
                      </div>
                    </>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/medical-records/${activeHistory.id_historia}`}
                      state={{ background: location }}
                    >
                      <Button size="sm" variant="outline">
                        Ver historia
                      </Button>
                    </Link>
                    <Link
                      to={`/medical-records/${activeHistory.id_historia}`}
                      state={{ background: location }}
                    >
                      <Button size="sm" variant="outline">
                        Editar
                      </Button>
                    </Link>
                    <Link
                      to={`/patients/${activeHistory.id_paciente}`}
                      state={{ background: location }}
                    >
                      <Button size="sm" variant="outline">
                        Paciente
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      onClick={() => openOdontogramaModal(activeHistory.id_historia, "empty")}
                    >
                      Abrir odontograma
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        openOdontogramaModal(activeHistory.id_historia, "from_last")
                      }
                    >
                      Consolidado
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void loadHistories()}
                    >
                      Refrescar panel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  Selecciona una historia del panel izquierdo para ver el detalle.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-sm">
              Usa el buscador para seleccionar un paciente y revisar sus historias clínicas.
            </p>
          </CardContent>
        </Card>
      )}

      <PatientSearchModal
        isOpen={patientModalOpen}
        onClose={() => setPatientModalOpen(false)}
        onSelectPatient={(paciente) => handlePatientSelected(paciente)}
      />

      <OdontogramaModal
        open={ogModalOpen}
        onClose={() => {
          setOgModalOpen(false);
          setOgError(null);
        }}
        data={ogData}
        loading={ogLoading}
        error={ogError}
        historiaId={selectedHistoriaId}
        ensureDraft={ensureDraftDraft}
        onReload={() => reloadOdontograma()}
        onRefreshRequest={() => reloadOdontograma(true)}
      />
    </div>
  );
};

export default MedicalRecords;

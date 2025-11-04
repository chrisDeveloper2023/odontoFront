import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  CalendarPlus,
  Eye,
  RefreshCw,
  Loader2,
  Check,
  CalendarClock,
  XCircle,
  History,
} from "lucide-react";

import { apiGet } from "@/api/client";
import { confirmarCita, reprogramarCita, cancelarCita } from "@/servicios/citas";
import { formatGuayaquilDate, formatGuayaquilTimeHM } from "@/lib/timezone";
import { Clinica } from "@/types/clinica";
import { Tenant } from "@/types/tenant";
import { mapClinica } from "@/lib/api/mappers";
import { APPOINTMENT_STATUS } from "@/constants/status";
import { API_ENDPOINTS } from "@/constants/api";
import { PLACEHOLDERS, INFO_MESSAGES } from "@/constants/messages";
import { getClinicas } from "@/lib/api/clinicas";

interface Appointment {
  id_cita: number;
  paciente: { nombres: string; apellidos: string };
  odontologo: { nombres: string; apellidos: string };
  consultorio: { nombre: string };
  estado: string;
  fecha_hora: string;
  clinica?: Clinica | null;
  tenant?: Tenant | null;
}

interface AppointmentListResponse {
  items: Appointment[];
  total: number;
  totalPages: number;
  page: number;
}

interface AppointmentFilters {
  page: number;
  limit: number;
  search?: string;
  estado?: string;
  patientId?: number;
  clinicId?: number;
  consultorioId?: number;
  dateFrom?: string;
  dateTo?: string;
  order?: "ASC" | "DESC";
}

type PatientOption = { id: number; nombre: string };
type ClinicOption = { id: number; nombre: string };
type ConsultorioOption = { id: number; nombre: string; id_clinica?: number | null };

const mapAppointment = (raw: any): Appointment => {
  const clinicFromRelation = raw?.clinica
    ? {
        id: Number(raw.clinica.id ?? raw.clinica.id_clinica ?? raw.id_clinica ?? 0) || undefined,
        nombre: raw.clinica.nombre ?? raw.clinica.nombre_clinica ?? "",
        tenant: raw.clinica.tenant
          ? {
              id: Number(raw.clinica.tenant.id ?? raw.clinica.tenant.id_tenant ?? 0) || undefined,
              nombre: raw.clinica.tenant.nombre ?? raw.clinica.tenant.nombre_legal ?? "",
              slug: raw.clinica.tenant.slug ?? raw.clinica.tenant.tenant_slug ?? "",
            }
          : null,
      }
    : null;

  const mappedClinic = raw?.clinica ? mapClinica(raw.clinica) : null;
  const clinica: Clinica | null =
    mappedClinic && mappedClinic.id_clinica ? mappedClinic : clinicFromRelation;

  const tenantSource = raw?.tenant ?? clinica?.tenant ?? clinicFromRelation?.tenant ?? null;

  return {
    id_cita: Number(raw.id_cita ?? raw.id ?? 0),
    paciente: {
      nombres: raw.paciente?.nombres ?? raw.paciente?.nombre ?? "",
      apellidos: raw.paciente?.apellidos ?? raw.paciente?.apellido ?? "",
    },
    odontologo: {
      nombres: raw.odontologo?.nombres ?? raw.odontologo?.nombre ?? "",
      apellidos: raw.odontologo?.apellidos ?? raw.odontologo?.apellido ?? "",
    },
    consultorio: {
      nombre: raw.consultorio?.nombre ?? raw.consultorio ?? "",
    },
    estado: String(raw.estado ?? "").toUpperCase(),
    fecha_hora: raw.fecha_hora ?? raw.fecha ?? raw.fechaHora ?? "",
    clinica: clinica ?? null,
    tenant: tenantSource ?? null,
  };
};

const APPOINTMENTS_PER_PAGE = 10;

type AppointmentMutationType = "confirm" | "reschedule" | "cancel";

const ACTIVE_APPOINTMENT_CONFLICT_TEXT =
  "Este paciente ya tiene una cita activa. Cancélala o márcala como realizada antes de crear otra.";

const toDateTimeLocalValue = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
};

const fromDateTimeLocalValue = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
};

const isActiveAppointmentConflict = (error: any) => {
  const status = error?.status ?? error?.response?.status;
  const message = String(
    error?.message ?? error?.payload?.mensaje ?? error?.payload?.error ?? "",
  ).toLowerCase();
  return status === 409 && message.includes("cita activa");
};

const handleAppointmentMutationError = (error: any, fallback: string) => {
  if (isActiveAppointmentConflict(error)) {
    toast.warning(ACTIVE_APPOINTMENT_CONFLICT_TEXT);
    return;
  }
  const message =
    error?.message ?? error?.payload?.mensaje ?? error?.payload?.error ?? fallback;
  toast.error(message || fallback);
};

const fetchAppointments = async (filters: AppointmentFilters): Promise<AppointmentListResponse> => {
  const params: Record<string, string> = {
    page: String(filters.page),
    limit: String(filters.limit),
  };

  if (filters.search) params.search = filters.search;
  if (filters.estado) params.estado = filters.estado;
  if (filters.patientId) params.id_paciente = String(filters.patientId);
  if (filters.clinicId) params.id_clinica = String(filters.clinicId);
  if (filters.consultorioId) params.id_consultorio = String(filters.consultorioId);
  if (filters.dateFrom) params.date_from = filters.dateFrom;
  if (filters.dateTo) params.date_to = filters.dateTo;
  if (filters.order) params.order = filters.order;

  const json = await apiGet<any>(API_ENDPOINTS.CITAS, params, {
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  const list: any[] = Array.isArray(json)
    ? json
    : Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.citas)
        ? json.citas
        : Array.isArray(json?.items)
          ? json.items
          : [];

  const items = list.map(mapAppointment);

  const totalRaw = Number(
    json?.total ?? json?.count ?? json?.totalCount ?? json?.meta?.total ?? items.length,
  );
  const total = Number.isNaN(totalRaw) ? items.length : totalRaw;

  const totalPagesRaw = Number(
    json?.totalPages ?? json?.total_pages ?? json?.meta?.totalPages ?? 0,
  );
  const totalPages =
    Number.isNaN(totalPagesRaw) || totalPagesRaw <= 0
      ? Math.max(1, Math.ceil((total || 1) / filters.limit))
      : totalPagesRaw;

  const pageRaw = Number(json?.page ?? json?.currentPage ?? filters.page);
  const page =
    Number.isNaN(pageRaw) || pageRaw <= 0 || pageRaw > totalPages ? filters.page : pageRaw;

  return {
    items,
    total,
    totalPages,
    page,
  };
};

const Appointments = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialPage = (() => {
    const parsed = Number(searchParams.get("page") || "1");
    return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
  })();

  const initialEstado = (searchParams.get("estado") || "").toUpperCase();
  const initialPatient = searchParams.get("id_paciente") || "";
  const initialClinic = searchParams.get("id_clinica") || "";
  const initialConsultorio = searchParams.get("id_consultorio") || "";
  const initialSearch = searchParams.get("search") || "";
  const initialDateFrom = searchParams.get("date_from") || "";
  const initialDateTo = searchParams.get("date_to") || "";
  const initialOrder = (searchParams.get("order") || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";

  const [page, setPage] = useState(initialPage);
  const [searchTermInput, setSearchTermInput] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [estadoFiltro, setEstadoFiltro] = useState<string>(initialEstado);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatient);
  const [clinicFilter, setClinicFilter] = useState<string>(initialClinic);
  const [consultorioFilter, setConsultorioFilter] = useState<string>(initialConsultorio);
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);
  const [order, setOrder] = useState<"ASC" | "DESC">(initialOrder);

  const [patientsOptions, setPatientsOptions] = useState<PatientOption[]>([]);
  const [clinicsOptions, setClinicsOptions] = useState<ClinicOption[]>([]);
  const [consultoriosOptions, setConsultoriosOptions] = useState<ConsultorioOption[]>([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [historyModalState, setHistoryModalState] = useState<{
    open: boolean;
    appointment: Appointment | null;
  }>({ open: false, appointment: null });
  const [rescheduleDateTime, setRescheduleDateTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [pendingAction, setPendingAction] = useState<{ id: number; type: AppointmentMutationType } | null>(null);

  const isActionPending = (id: number, type: AppointmentMutationType) =>
    pendingAction?.id === id && pendingAction?.type === type;

  const isAppointmentBusy = (id: number) => pendingAction?.id === id;

  const openRescheduleModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleDateTime(toDateTimeLocalValue(appointment.fecha_hora));
    setRescheduleReason("");
    setRescheduleModalOpen(true);
  };

  const closeRescheduleModal = () => {
    setRescheduleModalOpen(false);
    setRescheduleDateTime("");
    setRescheduleReason("");
    setSelectedAppointment(null);
  };

  const openCancelModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setCancelReason("");
    setCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    setCancelModalOpen(false);
    setCancelReason("");
    setSelectedAppointment(null);
  };

  const openHistoryModal = (appointment: Appointment) => {
    setHistoryModalState({ open: true, appointment });
  };

  const closeHistoryModal = () => {
    setHistoryModalState({ open: false, appointment: null });
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = searchTermInput.trim();
      setDebouncedSearch(trimmed);
      setPage(1);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchTermInput]);

  const loadCatalogs = useCallback(async () => {
    setIsLoadingCatalogs(true);
    try {
      const [clinicsRaw, patientsRaw, consultoriosRaw] = await Promise.all([
        getClinicas().catch(() => []),
        apiGet<any>("/pacientes", { page: 1, limit: 200 }).catch(() => ({ data: [] })),
        apiGet<any>("/consultorios").catch(() => ({ data: [] })),
      ]);

      const clinicsMapped: ClinicOption[] = (clinicsRaw ?? [])
        .map((item: any) => ({
          id: Number(item?.id ?? item?.id_clinica ?? item?.idClinica ?? item?.clinica_id ?? 0),
          nombre: String(item?.nombre ?? item?.nombre_clinica ?? item?.name ?? "").trim(),
        }))
        .filter((item) => Number.isFinite(item.id) && item.id > 0 && item.nombre.length > 0)
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

      const patientsList = Array.isArray(patientsRaw)
        ? patientsRaw
        : Array.isArray(patientsRaw?.data)
          ? patientsRaw.data
          : [];

      const patientsMapped: PatientOption[] = patientsList
        .map((patient: any) => ({
          id: Number(patient?.id_paciente ?? patient?.id ?? 0),
          nombre: `${String(patient?.nombres ?? "").trim()} ${String(patient?.apellidos ?? "").trim()}`.trim(),
        }))
        .filter((item) => Number.isFinite(item.id) && item.id > 0)
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

      const consultoriosList = Array.isArray(consultoriosRaw)
        ? consultoriosRaw
        : Array.isArray(consultoriosRaw?.data)
          ? consultoriosRaw.data
          : [];

      const consultoriosMapped: ConsultorioOption[] = consultoriosList
        .map((item: any) => ({
          id: Number(item?.id_consultorio ?? item?.id ?? 0),
          nombre: String(item?.nombre ?? "").trim(),
          id_clinica: item?.id_clinica ?? item?.clinica_id ?? item?.clinica?.id ?? null,
        }))
        .filter((item) => Number.isFinite(item.id) && item.id > 0 && item.nombre.length > 0)
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

      setClinicsOptions(clinicsMapped);
      setPatientsOptions(patientsMapped);
      setConsultoriosOptions(consultoriosMapped);
    } catch (error) {
      console.error("Error cargando catálogos de citas:", error);
      toast.error("No se pudieron cargar los catálogos para filtrar citas");
    } finally {
      setIsLoadingCatalogs(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalogs();
  }, [loadCatalogs]);

  useEffect(() => {
    if (!clinicFilter) return;
    const clinicIdNum = Number(clinicFilter);
    if (Number.isNaN(clinicIdNum)) return;
    setConsultorioFilter((prev) => {
      if (!prev) return prev;
      const consultorio = consultoriosOptions.find((c) => c.id === Number(prev));
      if (!consultorio) return "";
      if (consultorio.id_clinica && consultorio.id_clinica !== clinicIdNum) {
        return "";
      }
      return prev;
    });
  }, [clinicFilter, consultoriosOptions]);

  const filters = useMemo<AppointmentFilters>(
    () => ({
      page,
      limit: APPOINTMENTS_PER_PAGE,
      search: debouncedSearch || undefined,
      estado: estadoFiltro || undefined,
      patientId: selectedPatientId ? Number(selectedPatientId) : undefined,
      clinicId: clinicFilter ? Number(clinicFilter) : undefined,
      consultorioId: consultorioFilter ? Number(consultorioFilter) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      order,
    }),
    [
      page,
      debouncedSearch,
      estadoFiltro,
      selectedPatientId,
      clinicFilter,
      consultorioFilter,
      dateFrom,
      dateTo,
      order,
    ],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["appointments", filters],
    queryFn: () => fetchAppointments(filters),
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const handleConfirmAppointment = async (appointment: Appointment) => {
    setPendingAction({ id: appointment.id_cita, type: "confirm" });
    try {
      await confirmarCita(appointment.id_cita);
      toast.success("Cita confirmada correctamente.");
      await refetch();
    } catch (err: any) {
      handleAppointmentMutationError(err, "No se pudo confirmar la cita.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedAppointment) return;
    if (!rescheduleDateTime) {
      toast.error("Selecciona una nueva fecha y hora para reprogramar.");
      return;
    }

    const appointment = selectedAppointment;
    const isoDate = fromDateTimeLocalValue(rescheduleDateTime);
    if (!isoDate) {
      toast.error("La fecha y hora seleccionadas no son válidas.");
      return;
    }

    setPendingAction({ id: appointment.id_cita, type: "reschedule" });
    try {
      await reprogramarCita(appointment.id_cita, {
        fecha_hora: isoDate,
        motivo: rescheduleReason.trim() || undefined,
      });
      toast.success("Cita reprogramada correctamente.");
      closeRescheduleModal();
      await refetch();
    } catch (err: any) {
      handleAppointmentMutationError(err, "No se pudo reprogramar la cita.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleCancelSubmit = async () => {
    if (!selectedAppointment) return;
    const reason = cancelReason.trim();
    if (!reason) {
      toast.error("Ingresa un motivo para cancelar la cita.");
      return;
    }

    const appointment = selectedAppointment;
    setPendingAction({ id: appointment.id_cita, type: "cancel" });
    try {
      await cancelarCita(appointment.id_cita, { motivo: reason });
      toast.success("Cita cancelada correctamente.");
      closeCancelModal();
      await refetch();
    } catch (err: any) {
      handleAppointmentMutationError(err, "No se pudo cancelar la cita.");
    } finally {
      setPendingAction(null);
    }
  };

  const appointments = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalBackend = data?.total ?? appointments.length;

  const filteredConsultorios = useMemo(() => {
    const clinicId = clinicFilter ? Number(clinicFilter) : null;
    if (!clinicId) return consultoriosOptions;
    return consultoriosOptions.filter(
      (consultorio) => !consultorio.id_clinica || consultorio.id_clinica === clinicId,
    );
  }, [clinicFilter, consultoriosOptions]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.page > 1) params.set("page", String(filters.page));
    if (filters.search) params.set("search", filters.search);
    if (filters.estado) params.set("estado", filters.estado);
    if (filters.patientId) params.set("id_paciente", String(filters.patientId));
    if (filters.clinicId) params.set("id_clinica", String(filters.clinicId));
    if (filters.consultorioId) params.set("id_consultorio", String(filters.consultorioId));
    if (filters.dateFrom) params.set("date_from", filters.dateFrom);
    if (filters.dateTo) params.set("date_to", filters.dateTo);
    if (filters.order && filters.order !== "DESC") params.set("order", filters.order);
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const handleEstadoChange = (value: string) => {
    setEstadoFiltro(value);
    setPage(1);
  };

  const handleClinicChange = (value: string) => {
    setClinicFilter(value);
    setPage(1);
    if (!value) {
      setConsultorioFilter("");
    }
  };

  const handleConsultorioChange = (value: string) => {
    setConsultorioFilter(value);
    setPage(1);
  };

  const handlePatientChange = (value: string) => {
    setSelectedPatientId(value);
    setPage(1);
  };

  const handleOrderChange = (value: string) => {
    setOrder(value === "ASC" ? "ASC" : "DESC");
    setPage(1);
  };

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    setPage(1);
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTermInput("");
    setDebouncedSearch("");
    setEstadoFiltro("");
    setSelectedPatientId("");
    setClinicFilter("");
    setConsultorioFilter("");
    setDateFrom("");
    setDateTo("");
    setOrder("DESC");
    setPage(1);
  };

  const showLoadingState = isLoading && !isFetching;
  const showEmptyState = !showLoadingState && !isError && appointments.length === 0;
  const fetchError = isError ? (error as Error)?.message ?? "No se pudieron cargar las citas" : null;

  return (
    <>
      <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Citas médicas</h1>
          <p className="text-muted-foreground">Gestiona y filtra las citas agendadas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching && !isError}
            title="Actualizar listado"
          >
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Link to="/appointments/new" state={{ background: location }}>
            <Button>
              <CalendarPlus className="mr-2 h-4 w-4" />
              Nueva cita
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-muted-foreground">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTermInput}
                onChange={(event) => setSearchTermInput(event.target.value)}
                placeholder={
                  PLACEHOLDERS.SEARCH_APPOINTMENTS ?? "Buscar por paciente, medico o clinica"
                }
                className="pl-10"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Estado</label>
              <select
                value={estadoFiltro}
                onChange={(event) => handleEstadoChange(event.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Todos los estados</option>
                <option value={APPOINTMENT_STATUS.AGENDADA}>Agendada</option>
                <option value={APPOINTMENT_STATUS.CONFIRMADA}>Confirmada</option>
                <option value={APPOINTMENT_STATUS.REPROGRAMADA}>Reprogramada</option>
                <option value={APPOINTMENT_STATUS.CANCELADA}>Cancelada</option>
                <option value={APPOINTMENT_STATUS.REALIZADA}>Realizada</option>
                <option value={APPOINTMENT_STATUS.NO_ASISTIO}>No asistió</option>
                <option value={APPOINTMENT_STATUS.EN_PROGRESO}>En progreso</option>
                <option value={APPOINTMENT_STATUS.COMPLETADA}>Completada</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Paciente</label>
              <select
                value={selectedPatientId}
                onChange={(event) => handlePatientChange(event.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                disabled={isLoadingCatalogs}
              >
                <option value="">Todos los pacientes</option>
                {patientsOptions.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.nombre || `Paciente #${patient.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Orden</label>
              <select
                value={order}
                onChange={(event) => handleOrderChange(event.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="DESC">Más recientes primero</option>
                <option value="ASC">Próximas primero</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Clínica</label>
              <select
                value={clinicFilter}
                onChange={(event) => handleClinicChange(event.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                disabled={isLoadingCatalogs}
              >
                <option value="">Todas las clínicas</option>
                {clinicsOptions.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Consultorio</label>
              <select
                value={consultorioFilter}
                onChange={(event) => handleConsultorioChange(event.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                disabled={isLoadingCatalogs || filteredConsultorios.length === 0}
              >
                <option value="">Todos los consultorios</option>
                {filteredConsultorios.map((consultorio) => (
                  <option key={consultorio.id} value={consultorio.id}>
                    {consultorio.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Desde</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(event) => handleDateFromChange(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Hasta</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(event) => handleDateToChange(event.target.value)}
                min={dateFrom || undefined}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              {isFetching ? "Actualizando…" : `Mostrando ${appointments.length} de ${totalBackend} citas`}
            </div>
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {fetchError ? (
        <Card>
          <CardContent className="py-6 text-sm text-red-600">{fetchError}</CardContent>
        </Card>
      ) : null}

      {showLoadingState ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            {INFO_MESSAGES.LOADING}
          </CardContent>
        </Card>
      ) : null}

      {!showLoadingState && !fetchError ? (
        <div className="grid gap-4">
          {appointments.map((appointment) => {
            const fechaStr =
              formatGuayaquilDate(appointment.fecha_hora, { dateStyle: "medium" }) || "";
            const horaStr = formatGuayaquilTimeHM(appointment.fecha_hora);
            const tenantLabel =
              appointment.tenant?.nombre ||
              appointment.tenant?.slug ||
              appointment.clinica?.tenant?.nombre ||
              appointment.clinica?.tenant?.slug ||
              "";
            const isLifecycleLocked =
              appointment.estado === APPOINTMENT_STATUS.REALIZADA ||
              appointment.estado === APPOINTMENT_STATUS.CANCELADA;
            const canConfirm =
              !isLifecycleLocked && appointment.estado !== APPOINTMENT_STATUS.CONFIRMADA;
            const canReschedule = !isLifecycleLocked;
            const canCancel = !isLifecycleLocked;

            return (
              <Card key={appointment.id_cita} className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {`${appointment.paciente?.nombres ?? ""} ${appointment.paciente?.apellidos ?? ""}`.trim() ||
                            "Paciente sin nombre"}
                        </h3>
                        <Badge
                          variant={
                            appointment.estado === APPOINTMENT_STATUS.REALIZADA
                              ? "success"
                              : appointment.estado === APPOINTMENT_STATUS.CANCELADA
                                ? "destructive"
                                : appointment.estado === APPOINTMENT_STATUS.CONFIRMADA
                                  ? "secondary"
                                  : "outline"
                          }
                        >
                          {appointment.estado}
                        </Badge>
                      </div>
                      <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                        <div>
                          <span className="font-medium text-foreground">Medico:</span>{" "}
                          {`${appointment.odontologo?.nombres ?? ""} ${appointment.odontologo?.apellidos ?? ""}`.trim() ||
                            "Sin asignar"}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Fecha:</span>{" "}
                          {fechaStr} {horaStr ? `- ${horaStr}` : ""}
                        </div>
                        {appointment.clinica?.nombre ? (
                          <div>
                            <span className="font-medium text-foreground">Clínica:</span>{" "}
                            {appointment.clinica.nombre}
                          </div>
                        ) : null}
                        {tenantLabel ? (
                          <div>
                            <span className="font-medium text-foreground">Tenant:</span>{" "}
                            {tenantLabel}
                          </div>
                        ) : null}
                        {appointment.consultorio?.nombre ? (
                          <div>
                            <span className="font-medium text-foreground">Consultorio:</span>{" "}
                            {appointment.consultorio.nombre}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConfirmAppointment(appointment)}
                        disabled={!canConfirm || isAppointmentBusy(appointment.id_cita)}
                      >
                        {isActionPending(appointment.id_cita, "confirm") ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        Confirmar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRescheduleModal(appointment)}
                        disabled={!canReschedule || isAppointmentBusy(appointment.id_cita)}
                      >
                        <CalendarClock className="mr-2 h-4 w-4" />
                        Reprogramar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCancelModal(appointment)}
                        disabled={!canCancel || isAppointmentBusy(appointment.id_cita)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancelar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openHistoryModal(appointment)}>
                        <History className="mr-2 h-4 w-4" />
                        Historial
                      </Button>
                      <Link to={`/appointments/${appointment.id_cita}`} state={{ background: location }}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-1 h-4 w-4" />
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
      ) : null}

      {showEmptyState ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {INFO_MESSAGES.NO_RESULTS}
          </CardContent>
        </Card>
      ) : null}

      {!fetchError && !showLoadingState ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <Button onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
          >
            Siguiente
          </Button>
        </div>
      ) : null}
    </div>

    <Dialog open={rescheduleModalOpen} onOpenChange={(open) => (open ? setRescheduleModalOpen(true) : closeRescheduleModal())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reprogramar cita</DialogTitle>
          <DialogDescription>
            Selecciona una nueva fecha y hora para la cita{selectedAppointment ? ` de ${selectedAppointment.paciente?.nombres ?? ""} ${selectedAppointment.paciente?.apellidos ?? ""}`.trim() : ""}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reschedule-datetime">Fecha y hora</Label>
            <Input
              id="reschedule-datetime"
              type="datetime-local"
              value={rescheduleDateTime}
              onChange={(event) => setRescheduleDateTime(event.target.value)}
              disabled={isActionPending(selectedAppointment?.id_cita ?? 0, "reschedule")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reschedule-reason">Motivo (opcional)</Label>
            <Textarea
              id="reschedule-reason"
              value={rescheduleReason}
              onChange={(event) => setRescheduleReason(event.target.value)}
              placeholder="Describe brevemente el motivo del cambio"
              disabled={isActionPending(selectedAppointment?.id_cita ?? 0, "reschedule")}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={closeRescheduleModal}
            disabled={isActionPending(selectedAppointment?.id_cita ?? 0, "reschedule")}
          >
            Cancelar
          </Button>
          <Button onClick={handleRescheduleSubmit} disabled={isActionPending(selectedAppointment?.id_cita ?? 0, "reschedule")}>
            {isActionPending(selectedAppointment?.id_cita ?? 0, "reschedule") ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={cancelModalOpen} onOpenChange={(open) => (open ? setCancelModalOpen(true) : closeCancelModal())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar cita</DialogTitle>
          <DialogDescription>
            Indica el motivo de la cancelación para mantener el historial completo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="cancel-reason">Motivo</Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Ej. El paciente no podrá asistir"
              disabled={isActionPending(selectedAppointment?.id_cita ?? 0, "cancel")}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={closeCancelModal}
            disabled={isActionPending(selectedAppointment?.id_cita ?? 0, "cancel")}
          >
            Volver
          </Button>
          <Button variant="destructive" onClick={handleCancelSubmit} disabled={isActionPending(selectedAppointment?.id_cita ?? 0, "cancel")}>
            {isActionPending(selectedAppointment?.id_cita ?? 0, "cancel") ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Confirmar cancelación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={historyModalState.open} onOpenChange={(open) => (open ? setHistoryModalState((prev) => ({ ...prev, open })) : closeHistoryModal())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Historial de la cita</DialogTitle>
          <DialogDescription>
            Consulta los cambios de estado de la cita seleccionada.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 text-center text-sm text-muted-foreground">
          El detalle del historial estará disponible en la siguiente integración.
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeHistoryModal}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default Appointments;

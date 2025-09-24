import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, CalendarPlus, Eye } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { API_BASE } from "@/lib/http";
import { formatGuayaquilDate, formatGuayaquilTimeHM } from "@/lib/timezone";

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
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10; // por defecto backend maneja 10
  const [totalPages, setTotalPages] = useState(1);
  const [totalBackend, setTotalBackend] = useState(0);
  const [estadoFiltro, setEstadoFiltro] = useState<string>("");
  const [searchParams, setSearchParams] = useSearchParams();
  const idPacienteParam = searchParams.get("id_paciente") || "";

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError(null);
      try {
        const base = API_BASE;
        const params = new URLSearchParams();
        // ParAmetros estAndar
        params.set("page", String(page));
        params.set("limit", String(limit));
        // SinA3nimos comunes por compatibilidad
        params.set("pageNumber", String(page));
        params.set("page_size", String(limit));
        params.set("pageSize", String(limit));
        params.set("per_page", String(limit));
        params.set("perPage", String(limit));
        params.set("pagina", String(page));
        // Filtros del brief
        if (idPacienteParam) params.set("id_paciente", idPacienteParam);
        if (estadoFiltro) params.set("estado", estadoFiltro);
        const res = await fetch(`${base}/citas?${params.toString()}`);
        const json = await res.json();

        // Totales
        setTotalBackend(Number(json?.total) || 0);
        setTotalPages(Number(json?.totalPages) || 1);

        // Acepta varias formas: array plano, { data: [] }, { citas: [] }, { items: [] }
        const list: Appointment[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
            ? json.data
            : Array.isArray(json?.citas)
              ? json.citas
              : Array.isArray(json?.items)
                ? json.items
                : [];
        // Fallback: si no hay totales y llega mAs de 'limit', recorta para simular paginado
        const normalized = list.length > limit && (!json?.total && !json?.totalPages) ? list.slice(0, limit) : list;
        setAppointments(normalized);
      } catch (err: any) {
        console.error("Error al cargar citas:", err);
        setError(err?.message || "No se pudieron cargar las citas");
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [page, idPacienteParam, estadoFiltro]);

  // Inicializar filtros desde la URL (id_paciente, estado)
  useEffect(() => {
    const spEstado = (searchParams.get("estado") || "").toUpperCase();
    if (spEstado && spEstado !== estadoFiltro) setEstadoFiltro(spEstado);
    const spPage = Number(searchParams.get("page") || 0);
    if (spPage && spPage !== page) setPage(spPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredAppointments = appointments.filter((a) => {
    const fullPatient = `${a.paciente?.nombres ?? ""} ${a.paciente?.apellidos ?? ""}`.toLowerCase();
    const fullDoctor = `${a.odontologo?.nombres ?? ""} ${a.odontologo?.apellidos ?? ""}`.toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchesText = !term || fullPatient.includes(term) || fullDoctor.includes(term);
    const matchesEstado = !estadoFiltro || (a.estado || "").toUpperCase() === estadoFiltro.toUpperCase();
    return matchesText && matchesEstado;
  });

  if (loading) return <p>Cargando citas...</p>;
  if (error) return <p className="text-red-600 p-4">{error}</p>;

  const location = useLocation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Citas MAdicas</h1>
          <p className="text-muted-foreground">Listado de citas agendadas</p>
        </div>
        <Link to="/appointments/new" state={{ background: location }}>
          <Button className="flex items-center gap-2">
            <CalendarPlus className="h-4 w-4" />
            Nueva Cita
          </Button>
        </Link>
      </div>

      {/* Buscador */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente o mAdico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 items-center">
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Todos los estados</option>
                <option value="AGENDADA">Agendada</option>
                <option value="CONFIRMADA">Confirmada</option>
                <option value="CANCELADA">Cancelada</option>
                <option value="COMPLETADA">Completada</option>
              </select>
              <Button variant="outline" onClick={() => { setSearchTerm(""); setEstadoFiltro(""); }}>Limpiar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de citas */}
      <div className="grid gap-4">
        {filteredAppointments.map((appointment) => {
          const fechaStr = formatGuayaquilDate(appointment.fecha_hora, { dateStyle: "medium" }) || "";
          const horaStr = formatGuayaquilTimeHM(appointment.fecha_hora);
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
                        <span className="font-medium">MAdico:</span>{" "}
                        {`${appointment.odontologo?.nombres ?? ""} ${appointment.odontologo?.apellidos ?? ""}`}
                      </div>
                      <div>
                        <span className="font-medium">Fecha:</span>{" "}
                        {fechaStr} {horaStr ? `- ${horaStr}` : ""}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Link to={`/appointments/${appointment.id_cita}`} state={{ background: location }}>
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
            <p className="text-muted-foreground">No se encontraron citas que coincidan con la bAosqueda.</p>
          </CardContent>
        </Card>
      )}

      {/* PaginaciA3n */}
      <div className="flex justify-center items-center space-x-4 mt-6">
        <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
          Anterior
        </Button>
        <span className="text-sm">PAgina {page} de {totalPages}</span>
        <Button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
          Siguiente
        </Button>
      </div>
    </div>
  );
};

export default Appointments;




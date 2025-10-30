import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Eye, Edit, Calendar, User, Building2 } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { fetchHistoriasClinicas } from "@/lib/api/historiasClinicas";
import type { HistoriaClinica } from "@/types/historiaClinica";
import { toast } from "sonner";
import { abrirDraftOdontograma, getOdontogramaByHistoria, OdontogramaResponse } from "@/lib/api/odontograma";
import OdontogramaModal from "@/components/OdontogramaModal";

const MedicalRecords = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [historias, setHistorias] = useState<HistoriaClinica[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Función para formatear fecha y hora
  const formatDateTime = (dateString: string | null | undefined): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      return dateString;
    }
  };

  // Estado para odontograma embebido
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
          (mode === "from_last" ? "Error al abrir odontograma (desde último)" : "Error al abrir odontograma");
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

  const reloadOdontograma = useCallback(async (showToast = false) => {
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
  }, [selectedHistoriaId]);

  // Paginacion
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [totalBackend, setTotalBackend] = useState(0);
  const [searchParams] = useSearchParams();
  const idPacienteParam = searchParams.get("id_paciente") || "";

  useEffect(() => {
    let cancelled = false;
    setLoadingList(true);
    setListError(null);

    const query: Record<string, string | number> = {
      page,
      limit,
    };
    if (idPacienteParam) {
      query.id_paciente = idPacienteParam;
    }

    fetchHistoriasClinicas(query)
      .then(({ items, total, totalPages: totalPagesMeta }) => {
        if (cancelled) return;
        setHistorias(items);
        const resolvedTotal = total ?? items.length;
        const resolvedTotalPages = totalPagesMeta ?? (resolvedTotal ? Math.max(1, Math.ceil(resolvedTotal / limit)) : 1);
        setTotalBackend(resolvedTotal);
        setTotalPages(resolvedTotalPages);
      })
      .catch((e: any) => {
        if (cancelled) return;
        const message = e?.status === 403
          ? "Acceso denegado: la historia pertenece a otro tenant"
          : e?.message || "Error cargando historias clinicas";
        setListError(message);
        toast.error(message);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingList(false);
      });

    return () => {
      cancelled = true;
    };
  }, [idPacienteParam, limit, page]);

  const filteredRecords = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return historias;
    return historias.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }, [historias, searchTerm]);

  // limpiado: helpers de badges ya no usados

  const location = useLocation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Historias Clinicas</h1>
          <p className="text-muted-foreground">
            Gestiona todas las historias clinicas y registros medicos
          </p>
        </div>
        <Link to="/medical-records/new" state={{ background: location }}>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Historia Clinica
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cualquier campo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">Total Historias:</span>
              <span className="font-bold text-primary">{totalBackend || filteredRecords.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Medical Records List */}
      {loadingList && (
        <Card>
          <CardContent className="pt-6">Cargando historias clinicas...</CardContent>
        </Card>
      )}
      {listError && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6 text-red-700">{listError}</CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {filteredRecords.map((record, idx) => {
          const rid = Number(record?.id_historia ?? 0);
          const ridStr = rid > 0 ? String(rid) : "";
          const clinicName = record.clinica?.nombre || "Sin clínica";
          const patientName = record.paciente ? `${record.paciente.nombres || ''} ${record.paciente.apellidos || ''}`.trim() || 'Sin nombre' : `Paciente #${record.id_paciente}`;
          return (
          <Card key={`${rid || "row"}-${idx}`} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-semibold text-foreground">#{ridStr || ""}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Creacion:</span> {formatDateTime(record.fecha_creacion)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border flex-shrink-0 relative">
                        {record.paciente?.foto ? (
                          <>
                            <img 
                              src={record.paciente.foto} 
                              alt={patientName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-muted-foreground bg-muted">
                              {patientName.charAt(0).toUpperCase() || '?'}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-muted-foreground">
                            {patientName.charAt(0).toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <span className="text-foreground font-medium">{patientName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Actualizacion:</span> {formatDateTime(record.fecha_modificacion)}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium">Clinica:</span> {clinicName}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="font-medium text-foreground">Detalles:</span>
                      <span className="text-muted-foreground ml-2">{record.detalles_generales || ""}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {rid > 0 ? (
                    <Link to={`/medical-records/${ridStr}`} state={{ background: location }}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  )}
                  {rid > 0 ? (
                    <Link to={`/medical-records/${ridStr}`} state={{ background: location }}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  )}
                  <Link to={`/patients/${record.id_paciente}`} state={{ background: location }}>
                    <Button size="sm">
                      <User className="h-4 w-4 mr-1" />
                      Paciente
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!rid) {
                        toast.error("ID de historia invalido");
                        return;
                      }
                      void openOdontogramaModal(rid, "empty");
                    }}
                  >
                    Odontograma
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!rid) {
                        toast.error("ID de historia invalido");
                        return;
                      }
                      void openOdontogramaModal(rid, "from_last");
                    }}
                  >
                    consolidado
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )})}
      </div>

      {/* Paginacion */}
      <div className="flex justify-center items-center space-x-4 mt-6">
        <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
          Anterior
        </Button>
        <span className="text-sm">Pagina {page} de {totalPages}</span>
        <Button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
          Siguiente
        </Button>
      </div>

      {!loadingList && filteredRecords.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No se encontraron historias clinicas que coincidan con la busqueda.
            </p>
          </CardContent>
        </Card>
      )}

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

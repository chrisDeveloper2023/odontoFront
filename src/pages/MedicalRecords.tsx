import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Eye, Edit, Calendar, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import OdontogramaView from "@/components/OdontogramaView";
import { abrirDraftOdontograma, getOdontogramaByHistoria, OdontogramaResponse } from "@/lib/api/odontograma";

type HistoriaClinica = {
  id_historia: number;
  id_paciente: number;
  detalles_generales?: string | null;
  fecha_creacion?: string;
  fecha_modificacion?: string;
  [k: string]: any;
};

const MedicalRecords = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [historias, setHistorias] = useState<HistoriaClinica[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Estado para odontograma embebido
  const [selectedHistoriaId, setSelectedHistoriaId] = useState<string | null>(null);
  const [ogData, setOgData] = useState<OdontogramaResponse | null>(null);
  const [ogLoading, setOgLoading] = useState(false);
  const [ogError, setOgError] = useState<string | null>(null);

  useEffect(() => {
    const API = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");
    setLoadingList(true);
    setListError(null);
    fetch(`${API}/historias-clinicas`)
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.mensaje || res.statusText);
        return json as HistoriaClinica[];
      })
      .then((rows) => setHistorias(Array.isArray(rows) ? rows : []))
      .catch((e: any) => setListError(e?.message || "Error cargando historias clínicas"))
      .finally(() => setLoadingList(false));
  }, []);

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
          <h1 className="text-3xl font-bold text-foreground">Historias Clínicas</h1>
          <p className="text-muted-foreground">
            Gestiona todas las historias clínicas y registros médicos
          </p>
        </div>
        <Link to="/medical-records/new" state={{ background: location }}>
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
              placeholder="Buscar por cualquier campo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {/* Stats básicos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Historias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{filteredRecords.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Medical Records List */}
      {loadingList && (
        <Card>
          <CardContent className="pt-6">Cargando historias clínicas…</CardContent>
        </Card>
      )}
      {listError && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6 text-red-700">{listError}</CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {filteredRecords.map((record, idx) => {
          const rid = Number(
            (record as any)?.id_historia ??
            (record as any)?.id ??
            (record as any)?.historia?.id_historia ??
            (record as any)?.idHistoria ??
            (record as any)?.idHistoriaClinica ??
            0
          );
          const ridStr = rid > 0 ? String(rid) : "";
          return (
          <Card key={`${rid || "row"}-${idx}`} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-semibold text-foreground">Historia #{ridStr || "—"}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Creación:</span> {record.fecha_creacion || "—"}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="font-medium">Paciente:</span> #{record.id_paciente}
                    </div>
                    <div className="text-muted-foreground">
                      <span className="font-medium">Actualización:</span> {record.fecha_modificacion || "—"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="font-medium text-foreground">Detalles:</span>
                      <span className="text-muted-foreground ml-2">{record.detalles_generales || "—"}</span>
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
                    onClick={async () => {
                      setOgError(null);
                      setOgLoading(true);
                      try {
                        if (!rid) throw new Error("ID de historia inválido");
                        const res: OdontogramaResponse = await abrirDraftOdontograma(rid, "empty");
                        setSelectedHistoriaId(String(rid));
                        setOgData(res);
                      } catch (e: any) {
                        setOgError(e?.message || "Error al abrir odontograma");
                      } finally {
                        setOgLoading(false);
                      }
                    }}
                  >
                    Abrir Odontograma
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      setOgError(null);
                      setOgLoading(true);
                      try {
                        if (!rid) throw new Error("ID de historia inválido");
                        const res: OdontogramaResponse = await abrirDraftOdontograma(rid, "from_last");
                        setSelectedHistoriaId(String(rid));
                        setOgData(res);
                      } catch (e: any) {
                        setOgError(e?.message || "Error al abrir odontograma (desde último)");
                      } finally {
                        setOgLoading(false);
                      }
                    }}
                  >
                    Abrir desde último consolidado
                  </Button>
                </div>
              </div>
              {/* Odontograma embebido para el registro seleccionado */}
              {selectedHistoriaId === String(rid) && ogData && (
                <div className="border-t pt-4">
                  <OdontogramaView
                    data={ogData}
                    draftCtx={{ historiaId: rid || undefined }}
                    onReload={async () => {
                      try {
                        if (!rid) return;
                        const fresh = await getOdontogramaByHistoria(String(rid));
                        setOgData(fresh);
                      } catch (e) {
                        /* noop */
                      }
                    }}
                  />
                </div>
              )}
              {selectedHistoriaId === String(rid) && ogLoading && (
                <div className="text-sm text-muted-foreground">Cargando odontograma…</div>
              )}
              {selectedHistoriaId === String(rid) && ogError && (
                <div className="text-sm text-red-600">{ogError}</div>
              )}
            </CardContent>
          </Card>
        )})}
      </div>

      {!loadingList && filteredRecords.length === 0 && (
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

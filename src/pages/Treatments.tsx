import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, RefreshCw, Search, Pencil, Trash, ExternalLink } from "lucide-react";
import TreatmentFormModal from "@/components/TreatmentFormModal";
import {
  fetchTreatmentsContext,
  createTreatment,
  updateTreatment,
  deleteTreatment,
} from "@/lib/api/treatments";
import { getClinicas } from "@/lib/api/clinicas";
import type { Treatment, TreatmentPayload, TreatmentsContext } from "@/types/treatment";

type ClinicOption = { id: number; nombre: string };

const formatCurrency = (value: number) => {
  const formatter = new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
  return formatter.format(value || 0);
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return fallback;
};

const TreatmentsPage = () => {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [historiaInput, setHistoriaInput] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Treatment | null>(null);
  const [clinics, setClinics] = useState<ClinicOption[]>([]);
  const [context, setContext] = useState<TreatmentsContext | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as { historiaId?: number } | undefined;

  const historiaFromQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get("historia");
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
  }, [location.search]);

  const historiaId = historiaFromQuery ?? locationState?.historiaId ?? null;

  useEffect(() => {
    if (historiaId) {
      setHistoriaInput(String(historiaId));
    } else {
      setHistoriaInput("");
    }
  }, [historiaId]);

  const loadClinics = async () => {
    const clinicsRaw = await getClinicas();
    setClinics(
      clinicsRaw
        .map((item) => ({
          id: Number(item.id ?? item.id_clinica ?? item.idClinica ?? item.clinica_id ?? 0) || 0,
          nombre: String(item.nombre ?? item.nombre_clinica ?? item.name ?? `Clínica ${item.id}`),
        }))
        .filter((item) => item.id),
    );
  };

  useEffect(() => {
    void loadClinics().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!historiaId) {
      setContext(null);
      setTreatments([]);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [ctx] = await Promise.all([
          fetchTreatmentsContext(historiaId),
        ]);
        if (cancelled) return;
        setContext(ctx);
        setTreatments(ctx.tratamientos);
      } catch (error) {
        if (cancelled) return;
        const message = getErrorMessage(error, "No se pudo cargar el contexto de tratamientos");
        setError(message);
        toast.error(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [historiaId]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return treatments;
    return treatments.filter((treatment) => {
      const clinic = treatment.clinica?.nombre ?? "";
      const pieza = treatment.pieza?.numero_fdi ? `fdi ${treatment.pieza.numero_fdi}` : "";
      const historia = treatment.pieza?.odontograma?.id_historia ?? "";
      return [treatment.nombre, treatment.descripcion ?? "", clinic, pieza, historia]
        .map((chunk) => String(chunk ?? "").toLowerCase())
        .some((chunk) => chunk.includes(term));
    });
  }, [treatments, searchTerm]);

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
  };

  const handleCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (treatment: Treatment) => {
    setEditing(treatment);
    setModalOpen(true);
  };

  const refreshList = async () => {
    if (!historiaId) return;
    setLoading(true);
    setError(null);
    try {
      const ctx = await fetchTreatmentsContext(historiaId);
      setContext(ctx);
      setTreatments(ctx.tratamientos);
      toast.success("Listado de tratamientos actualizado");
    } catch (error) {
      const message = getErrorMessage(error, "No se pudieron refrescar los tratamientos");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: TreatmentPayload) => {
    try {
      setSaving(true);
      let updated: Treatment;
      if (editing) {
        updated = await updateTreatment(editing.id_tratamiento, values);
        setTreatments((prev) =>
          prev.map((item) => (item.id_tratamiento === updated.id_tratamiento ? updated : item)),
        );
        setContext((prev) =>
          prev ? { ...prev, tratamientos: prev.tratamientos.map((item) => (item.id_tratamiento === updated.id_tratamiento ? updated : item)) } : prev,
        );
        toast.success("Tratamiento actualizado");
      } else {
        updated = await createTreatment(values);
        setTreatments((prev) => [updated, ...prev]);
        setContext((prev) =>
          prev ? { ...prev, tratamientos: [updated, ...(prev.tratamientos ?? [])] } : prev,
        );
        toast.success("Tratamiento creado");
      }
      closeModal();
    } catch (error) {
      const message = getErrorMessage(error, "No se pudo guardar el tratamiento");
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (treatment: Treatment) => {
    const ok = window.confirm(`¿Eliminar el tratamiento "${treatment.nombre}"?`);
    if (!ok) return;
    try {
      await deleteTreatment(treatment.id_tratamiento);
      setTreatments((prev) => prev.filter((item) => item.id_tratamiento !== treatment.id_tratamiento));
      setContext((prev) =>
        prev
          ? {
              ...prev,
              tratamientos: prev.tratamientos.filter(
                (item) => item.id_tratamiento !== treatment.id_tratamiento,
              ),
            }
          : prev,
      );
      toast.success("Tratamiento eliminado");
    } catch (error) {
      const message = getErrorMessage(error, "No se pudo eliminar el tratamiento");
      toast.error(message);
    }
  };

  const goToOdontograma = (targetHistoriaId: number | null | undefined) => {
    if (!targetHistoriaId) return;
    navigate(`/odontograma?historia=${targetHistoriaId}`, { state: { historiaId: targetHistoriaId } });
  };

  const goToHistoria = (targetHistoriaId: number | null | undefined) => {
    if (!targetHistoriaId) return;
    navigate(`/medical-records/${targetHistoriaId}`, { state: { background: location } });
  };

  const piezaOptions = useMemo(() => {
    if (!context?.odontograma?.piezas) return [];
    return context.odontograma.piezas.map((pieza) => ({
      id: pieza.id_pieza,
      numero_fdi: pieza.numero_fdi ?? null,
      label: pieza.numero_fdi ? `FDI ${pieza.numero_fdi}` : `Pieza ${pieza.id_pieza}`,
    }));
  }, [context?.odontograma?.piezas]);

  const historiaLabel = useMemo(() => {
    if (!context?.historia) return historiaId ? String(historiaId) : undefined;
    const paciente = context.historia.paciente
      ? [context.historia.paciente.nombres, context.historia.paciente.apellidos]
          .filter(Boolean)
          .join(" ")
      : "";
    return paciente ? `${context.historia.id_historia} · ${paciente}` : String(context.historia.id_historia);
  }, [context?.historia, historiaId]);

  const handleHistoriaSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = historiaInput.trim();
    const parsed = Number(trimmed);
    if (!trimmed || Number.isNaN(parsed) || parsed <= 0) {
      toast.error("Ingresa un ID de historia válido");
      return;
    }
    navigate({ pathname: "/treatments", search: `?historia=${parsed}` }, { replace: true, state: { historiaId: parsed } });
  };

  if (!historiaId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground space-y-4">
            <p>Selecciona una historia clínica para gestionar sus tratamientos.</p>
            <form className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center" onSubmit={handleHistoriaSubmit}>
              <Input
                className="max-w-xs"
                placeholder="ID de historia clínica"
                value={historiaInput}
                onChange={(event) => setHistoriaInput(event.target.value)}
              />
              <Button type="submit">Cargar historia</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tratamientos</h1>
          <p className="text-muted-foreground">
            Planes y procedimientos asociados a la historia #{historiaLabel}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshList} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refrescar
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo tratamiento
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
            <Search className="h-4 w-4" />
            Buscar tratamientos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Nombre, clínica, FDI, historia..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="pt-6 text-sm text-red-700">{error}</CardContent>
        </Card>
      ) : null}

      {loading ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">Cargando tratamientos...</CardContent>
        </Card>
      ) : null}

      {!loading && filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No hay tratamientos que coincidan con la búsqueda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((treatment) => {
            const clinicName =
              treatment.clinica?.nombre ??
              treatment.historia?.clinica?.nombre ??
              "Sin clínica";
            const historiaAsociada = treatment.id_historia ?? treatment.historia?.id_historia ?? null;
            const piezaFDI = treatment.pieza?.numero_fdi ? `FDI ${treatment.pieza.numero_fdi}` : null;
            const piezaId = treatment.id_pieza;

            return (
              <Card key={treatment.id_tratamiento} className="hover:shadow-md transition-shadow">
                <CardContent className="space-y-3 pt-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">{treatment.nombre}</h2>
                      <p className="text-sm text-muted-foreground">
                        {treatment.descripcion || "Sin descripción"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold text-foreground">
                        {formatCurrency(treatment.costo_base)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Creado:{" "}
                        {treatment.fecha_creacion
                          ? new Date(treatment.fecha_creacion).toLocaleDateString()
                          : "Sin fecha"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{clinicName}</Badge>
                    {piezaFDI ? <Badge variant="outline">{piezaFDI}</Badge> : null}
                    {piezaId ? <Badge variant="outline">pieza #{piezaId}</Badge> : null}
                    <Badge variant={treatment.facturado ? "default" : "outline"}>
                      {treatment.facturado ? "Facturado" : "Sin factura"}
                    </Badge>
                    <Badge variant={treatment.pagado ? "default" : "outline"}>
                      {treatment.pagado ? "Pagado" : "Pendiente"}
                    </Badge>
                    {historiaAsociada ? <Badge variant="outline">Historia #{historiaAsociada}</Badge> : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(treatment)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(treatment)}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!historiaAsociada}
                      onClick={() => goToHistoria(historiaAsociada)}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ver historia
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!historiaAsociada}
                      onClick={() => goToOdontograma(historiaAsociada)}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ver odontograma
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <TreatmentFormModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        loading={saving}
        initialData={editing ?? undefined}
        clinics={clinics}
        historiaId={historiaId}
        historiaLabel={historiaLabel}
        piezaOptions={piezaOptions}
      />
    </div>
  );
};

export default TreatmentsPage;

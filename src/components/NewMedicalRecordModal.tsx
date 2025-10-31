import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/api/client";
import { formatGuayaquilDate, formatGuayaquilTimeHM } from "@/lib/timezone";
import { getClinicas } from "@/lib/api/clinicas";
import { fetchHistoriasClinicas } from "@/lib/api/historiasClinicas";
import type { HistoriaClinica } from "@/types/historiaClinica";

const EMPTY_OPTION_VALUE = "__none__";

const RESPUESTA_BINARIA_OPTIONS = [
  { value: EMPTY_OPTION_VALUE, label: "Sin dato" },
  { value: "SI", label: "SI" },
  { value: "NO", label: "NO" },
  { value: "DESCONOCE", label: "Desconoce" },
] as const;

const ALTERACION_PRESION_OPTIONS = [
  { value: EMPTY_OPTION_VALUE, label: "Sin dato" },
  { value: "ALTA", label: "Alta" },
  { value: "BAJA", label: "Baja" },
  { value: "NORMAL", label: "Normal" },
  { value: "DESCONOCIDA", label: "Desconocida" },
] as const;

type Option = { id: number; nombre: string };
type CitaOption = { 
  id_cita: number; 
  fecha_hora?: string; 
  estado?: string;
  consultorio?: { nombre?: string } | null;
  odontologo?: { nombres?: string; apellidos?: string; nombre?: string } | null;
};

type FormState = {
  idPaciente: string;
  idClinica: string;
  idCita: string;
  detallesGenerales: string;
  motivoConsulta: string;
  antecedentesCardiacos: string | null;
  antecedentesCardiacosDetalle: string;
  alteracionPresion: string | null;
  presionDetalle: string;
  trastornosSanguineos: string;
  trastornosGastrointestinales: string;
  otrasEnfermedades: string;
  antecedentesPatologicosFamiliares: string;
  alergias: string;
  medicamentosActuales: string;
  habitos: string;
  observaciones: string;
  examenClinico: string;
  examenHalitosis: string;
  examenCarrillos: string;
  examenPaladarTorus: string;
  examenPisoBoca: string;
  examenLengua: string;
  examenMaxilares: string;
  examenEncias: string;
  examenBruxismo: string;
  examenDientes: string;
  examenAtm: string;
  examenOclusion: string;
};

const initialForm: FormState = {
  idPaciente: "",
  idClinica: "",
  idCita: "",
  detallesGenerales: "",
  motivoConsulta: "",
  antecedentesCardiacos: null,
  antecedentesCardiacosDetalle: "",
  alteracionPresion: null,
  presionDetalle: "",
  trastornosSanguineos: "",
  trastornosGastrointestinales: "",
  otrasEnfermedades: "",
  antecedentesPatologicosFamiliares: "",
  alergias: "",
  medicamentosActuales: "",
  habitos: "",
  observaciones: "",
  examenClinico: "",
  examenHalitosis: "",
  examenCarrillos: "",
  examenPaladarTorus: "",
  examenPisoBoca: "",
  examenLengua: "",
  examenMaxilares: "",
  examenEncias: "",
  examenBruxismo: "",
  examenDientes: "",
  examenAtm: "",
  examenOclusion: "",
};

const formatFecha = (iso?: string) => {
  if (!iso) return "";
  const fecha = formatGuayaquilDate(iso, { dateStyle: "medium" });
  const hora = formatGuayaquilTimeHM(iso);
  if (fecha && hora) return `${fecha} ${hora}`;
  if (fecha) return fecha;
  if (hora) return hora;
  return iso;
};

interface NewMedicalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPatientId?: string;
  onMedicalRecordCreated?: (medicalRecord: any) => void;
}

const NewMedicalRecordModal: React.FC<NewMedicalRecordModalProps> = ({
  isOpen,
  onClose,
  preselectedPatientId = "",
  onMedicalRecordCreated,
}) => {
  const [patients, setPatients] = useState<Option[]>([]);
  const [clinicas, setClinicas] = useState<Option[]>([]);
  const [citasDisponibles, setCitasDisponibles] = useState<CitaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({ ...initialForm, idPaciente: preselectedPatientId });
  const [historias, setHistorias] = useState<HistoriaClinica[]>([]);
  const [loadingHistorias, setLoadingHistorias] = useState(false);
  const [selectedHistoriaId, setSelectedHistoriaId] = useState<number | null>(null);
  const [selectedHistoria, setSelectedHistoria] = useState<HistoriaClinica | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  // Actualizar el formulario cuando se abre el modal con un paciente preseleccionado o cambia el preselectedPatientId
  useEffect(() => {
    if (isOpen) {
      if (preselectedPatientId) {
        setForm((prev) => ({
          ...prev,
          idPaciente: preselectedPatientId,
        }));
      } else {
        // Si no hay paciente preseleccionado, resetear el form
        setForm((prev) => ({
          ...initialForm,
          idPaciente: "",
        }));
      }
    } else {
      // Limpiar datos cuando el modal se cierra
      setCitasDisponibles([]);
      setHistorias([]);
      setSelectedHistoriaId(null);
      setSelectedHistoria(null);
    }
  }, [isOpen, preselectedPatientId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    
    const loadBasics = async () => {
      try {
        setLoading(true);
        const [pacRes, clinRes] = await Promise.all([
          apiGet<any>('/pacientes', { page: 1, limit: 100 }),
          getClinicas(),
        ]);

        const mapRows = (raw: any): Option[] => {
          if (!raw) return [];
          const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
          return list
            .map((item: any) => ({
              id: Number(item.id_paciente ?? item.id ?? item.idPaciente ?? 0),
              nombre: `${item.nombres ?? item.nombre ?? ''} ${item.apellidos ?? ''}`.trim() || String(item.id ?? ''),
            }))
            .filter((opt) => Number.isFinite(opt.id));
        };

        const mapClinicas = (raw: any[]): Option[] => {
          if (!raw) return [];
          return raw
            .map((item: any) => ({
              id: Number(item.id ?? item.id_clinica ?? item.idClinica ?? item.clinica_id),
              nombre: item.nombre ?? item.nombre_clinica ?? item.alias ?? item.name ?? `Clinica ${item.id ?? ""}`,
            }))
            .filter((opt) => Number.isFinite(opt.id));
        };

        const mappedClinicas = mapClinicas(clinRes);
        setPatients(mapRows(pacRes));
        setClinicas(mappedClinicas);
        
        // Si solo hay una clínica, seleccionarla automáticamente
        setForm((prev) => {
          if (mappedClinicas.length === 1 && !prev.idClinica) {
            return {
              ...prev,
              idClinica: String(mappedClinicas[0].id),
            };
          }
          return prev;
        });
      } catch (error) {
        console.error(error);
        toast.error('No se pudieron cargar pacientes o clínicas');
      } finally {
        setLoading(false);
      }
    };
    loadBasics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Cargar citas e historias cuando hay un paciente seleccionado y el modal está abierto
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    
    // Determinar qué ID de paciente usar:
    // 1. Si el usuario ha seleccionado un paciente manualmente (form.idPaciente tiene valor), usar ese
    // 2. Si no hay selección manual pero hay preselectedPatientId, usar ese
    // 3. Si no hay ninguno, no cargar nada
    const pacienteId = (form.idPaciente && form.idPaciente.trim() !== "") 
      ? form.idPaciente 
      : (preselectedPatientId && preselectedPatientId.trim() !== "" ? preselectedPatientId : null);
    
    if (!pacienteId || pacienteId.trim() === "") {
      setCitasDisponibles([]);
      setHistorias([]);
      setSelectedHistoriaId(null);
      setSelectedHistoria(null);
      return;
    }
    
    const loadCitas = async () => {
      try {
        setLoadingCitas(true);
        const res = await apiGet<any>(`/pacientes/${pacienteId}/citas-disponibles`);
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setCitasDisponibles(list as CitaOption[]);
      } catch (error) {
        console.error("Error al cargar citas:", error);
        setCitasDisponibles([]);
      } finally {
        setLoadingCitas(false);
      }
    };

    const loadHistorias = async () => {
      try {
        setLoadingHistorias(true);
        const result = await fetchHistoriasClinicas({
          id_paciente: pacienteId,
          page: 1,
          limit: 1000,
        });
        setHistorias(result.items || []);
      } catch (error) {
        console.error("Error al cargar historias clínicas:", error);
        setHistorias([]);
        toast.error("Error al cargar historias clínicas");
      } finally {
        setLoadingHistorias(false);
      }
    };

    loadCitas();
    loadHistorias();
  }, [form.idPaciente, preselectedPatientId, isOpen]);

  const updateField = (field: keyof typeof form, value: string) => {
    const normalizedValue =
      field === 'idCita' && value === EMPTY_OPTION_VALUE
        ? ''
        : value;
    setForm((prev) => ({ ...prev, [field]: normalizedValue }));
    if (field === 'idPaciente') {
      // Al cambiar el paciente, limpiar la cita seleccionada y la historia seleccionada
      setForm((prev) => ({ ...prev, idPaciente: normalizedValue, idCita: '' }));
      setSelectedHistoriaId(null);
      setSelectedHistoria(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.idPaciente || !form.idClinica) {
      toast.error('Selecciona paciente y clínica');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        id_clinica: Number(form.idClinica),
        id_cita: form.idCita ? Number(form.idCita) : undefined,
        detalles_generales: form.detallesGenerales || null,
        detallesGenerales: form.detallesGenerales || null,
        motivo_consulta: form.motivoConsulta || null,
        antecedentes_cardiacos: form.antecedentesCardiacos || null,
        antecedentes_cardiacos_detalle: form.antecedentesCardiacosDetalle || null,
        alteracion_presion: form.alteracionPresion || null,
        presion_detalle: form.presionDetalle || null,
        trastornos_sanguineos: form.trastornosSanguineos || null,
        trastornos_gastrointestinales: form.trastornosGastrointestinales || null,
        otras_enfermedades: form.otrasEnfermedades || null,
        antecedentes_patologicos_familiares: form.antecedentesPatologicosFamiliares || null,
        alergias: form.alergias || null,
        medicamentos_actuales: form.medicamentosActuales || null,
        habitos: form.habitos || null,
        observaciones: form.observaciones || null,
        examen_clinico: form.examenClinico || null,
        examen_halitosis: form.examenHalitosis || null,
        examen_carrillos: form.examenCarrillos || null,
        examen_paladar_torus: form.examenPaladarTorus || null,
        examen_piso_boca: form.examenPisoBoca || null,
        examen_lengua: form.examenLengua || null,
        examen_maxilares: form.examenMaxilares || null,
        examen_encias: form.examenEncias || null,
        examen_bruxismo: form.examenBruxismo || null,
        examen_dientes: form.examenDientes || null,
        examen_atm: form.examenAtm || null,
        examen_oclusion: form.examenOclusion || null,
      };

      const res = await apiPost<any>(`/pacientes/${form.idPaciente}/historias-clinicas`, payload);
      toast.success('Historia clínica creada correctamente');
      
      if (onMedicalRecordCreated) {
        onMedicalRecordCreated(res);
      }
      
      // Reset form and close modal
      setForm({ ...initialForm, idPaciente: preselectedPatientId });
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'No se pudo crear la historia clínica');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setForm({ ...initialForm, idPaciente: preselectedPatientId });
    setSelectedHistoriaId(null);
    setSelectedHistoria(null);
    setHistorias([]);
    onClose();
  };

  // Agrupar historias por mes/año
  const historiasPorMes = useMemo(() => {
    const grouped: Record<string, HistoriaClinica[]> = {};
    historias.forEach((historia) => {
      // Usar la fecha de la cita asociada, o la fecha de creación de la historia como fallback
      const fecha = historia.cita?.fecha_hora || historia.fecha_creacion || historia.fecha_modificacion || "";
      if (!fecha) {
        const sinFechaKey = "Sin fecha";
        if (!grouped[sinFechaKey]) grouped[sinFechaKey] = [];
        grouped[sinFechaKey].push(historia);
        return;
      }
      
      try {
        const date = new Date(fecha);
        const monthKey = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
        if (!grouped[monthKey]) grouped[monthKey] = [];
        grouped[monthKey].push(historia);
      } catch {
        const sinFechaKey = "Sin fecha";
        if (!grouped[sinFechaKey]) grouped[sinFechaKey] = [];
        grouped[sinFechaKey].push(historia);
      }
    });
    
    // Ordenar las claves (meses) de más reciente a más antiguo
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      if (a === "Sin fecha") return 1;
      if (b === "Sin fecha") return -1;
      try {
        const dateA = new Date(a);
        const dateB = new Date(b);
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
        return dateB.getTime() - dateA.getTime();
      } catch {
        return 0;
      }
    });
    
    // Ordenar historias dentro de cada grupo por fecha de la cita (o fecha de creación)
    sortedKeys.forEach((key) => {
      grouped[key].sort((a, b) => {
        const fechaA = new Date(a.cita?.fecha_hora || a.fecha_creacion || a.fecha_modificacion || "");
        const fechaB = new Date(b.cita?.fecha_hora || b.fecha_creacion || b.fecha_modificacion || "");
        return fechaB.getTime() - fechaA.getTime();
      });
    });
    
    return sortedKeys.map((key) => ({ month: key, historias: grouped[key] }));
  }, [historias]);

  const handleSelectHistoria = (historia: HistoriaClinica) => {
    setSelectedHistoriaId(historia.id_historia);
    setSelectedHistoria(historia);
    
    // Expandir el mes correspondiente a esta historia
    const fecha = historia.cita?.fecha_hora || historia.fecha_creacion || historia.fecha_modificacion || "";
    if (fecha) {
      try {
        const date = new Date(fecha);
        const monthKey = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
        setExpandedMonths((prev) => new Set(prev).add(monthKey));
      } catch {
        // Si no se puede parsear la fecha, no hacer nada
      }
    }
    
    // Cargar los detalles completos de la historia
    apiGet<any>(`/historias-clinicas/${historia.id_historia}`)
      .then((fullHistoria) => {
        setSelectedHistoria(fullHistoria as HistoriaClinica);
      })
      .catch((error) => {
        console.error("Error al cargar detalles de historia:", error);
        setSelectedHistoria(historia);
      });
  };

  const handleNewHistoria = () => {
    setSelectedHistoriaId(null);
    setSelectedHistoria(null);
    setForm((prev) => ({ ...prev, idCita: "" }));
  };

  const toggleMonth = (month: string) => {
    setExpandedMonths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(month)) {
        newSet.delete(month);
      } else {
        newSet.add(month);
      }
      return newSet;
    });
  };

  // Helper para obtener valores de texto de la historia
  const getTextValue = (field: string): string => {
    if (!selectedHistoria) return "";
    return (selectedHistoria as any)[field] || "";
  };

  // Helper para obtener valores de select
  const getSelectValue = (field: string): string => {
    if (!selectedHistoria) return EMPTY_OPTION_VALUE;
    const value = (selectedHistoria as any)[field];
    return value || EMPTY_OPTION_VALUE;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 flex-shrink-0">
          <DialogTitle>Historias Clínicas</DialogTitle>
          <DialogDescription className="sr-only">
            Gestiona y consulta las historias clínicas de los pacientes
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Panel Izquierdo - 20% - Lista de Historias */}
          <div className="w-[20%] border-r border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <Label>Paciente *</Label>
              <Select
                value={form.idPaciente || undefined}
                onValueChange={(value) => updateField('idPaciente', value)}
                disabled={loading}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={loading ? 'Cargando...' : 'Selecciona paciente'} />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-2">
                {(() => {
                  // Determinar el ID del paciente para la condición de visualización
                  // Priorizar form.idPaciente (selección manual) sobre preselectedPatientId
                  const pacienteIdActual = (form.idPaciente && form.idPaciente.trim() !== "") 
                    ? form.idPaciente 
                    : (preselectedPatientId && preselectedPatientId.trim() !== "" ? preselectedPatientId : "");
                  
                  if (!pacienteIdActual) {
                    return (
                      <div className="text-center text-muted-foreground py-8">
                        Selecciona un paciente para ver sus historias
                      </div>
                    );
                  }
                  
                  if (loadingHistorias) {
                    return (
                      <div className="text-center text-muted-foreground py-8">
                        Cargando historias...
                      </div>
                    );
                  }
                  
                  if (historiasPorMes.length === 0) {
                    return (
                      <div className="text-center text-muted-foreground py-8">
                        No hay historias clínicas
                      </div>
                    );
                  }
                  
                  return (
                    <>
                      <Button
                        variant={selectedHistoriaId === null ? "default" : "outline"}
                        className="w-full mb-2"
                        onClick={handleNewHistoria}
                      >
                        + Nueva Historia
                      </Button>
                      {historiasPorMes.map(({ month, historias: groupHistorias }) => {
                        const isExpanded = expandedMonths.has(month);
                        return (
                          <Collapsible
                            key={month}
                            open={isExpanded}
                            onOpenChange={() => toggleMonth(month)}
                            className="mb-2"
                          >
                            <CollapsibleTrigger className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded text-left">
                              <div className="flex items-center gap-1.5">
                                {isExpanded ? (
                                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                )}
                                <span className="text-xs font-semibold text-muted-foreground uppercase">
                                  {month}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                ({groupHistorias.length})
                              </span>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pl-6 mt-1">
                              <div className="space-y-1">
                                {groupHistorias.map((historia) => (
                                  <Button
                                    key={historia.id_historia}
                                    variant={selectedHistoriaId === historia.id_historia ? "default" : "ghost"}
                                    className="w-full justify-start text-left h-auto py-1.5 px-2"
                                    onClick={() => handleSelectHistoria(historia)}
                                  >
                                    <div className="text-xs text-muted-foreground">
                                      {formatFecha(historia.cita?.fecha_hora || historia.fecha_creacion || historia.fecha_modificacion)}
                                    </div>
                                  </Button>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </ScrollArea>
          </div>

          {/* Panel Derecho - 80% - Formulario/Detalles */}
          <div className="w-[80%] overflow-y-auto flex flex-col min-h-0">
            {selectedHistoria ? (
              // Vista de detalles de historia sele cyanada
              <div className="p-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Informacion general</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Detalles generales</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("detalles_generales") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Motivo de consulta</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("motivo_consulta") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Antecedentes relevantes</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("antecedentes") || "Sin datos"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Antecedentes y habitos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Label className="w-48 text-left pt-2">Antecedentes cardiacos</Label>
                      <div className="flex-1">
                        <p className="text-sm">
                          {getSelectValue("antecedentes_cardiacos") === EMPTY_OPTION_VALUE 
                            ? "Sin dato" 
                            : getSelectValue("antecedentes_cardiacos")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Label className="w-48 text-left pt-2">Presion arterial</Label>
                      <div className="flex-1">
                        <p className="text-sm">
                          {getSelectValue("alteracion_presion") === EMPTY_OPTION_VALUE 
                            ? "Sin dato" 
                            : getSelectValue("alteracion_presion")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Detalle antecedentes cardiacos</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("antecedentes_cardiacos_detalle") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Detalle presion arterial</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("presion_detalle") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Trastornos sanguineos</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("trastornos_sanguineos") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Trastornos gastrointestinales</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("trastornos_gastrointestinales") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Otras enfermedades</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("otras_enfermedades") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Habitos</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("habitos") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Antecedentes patologicos familiares</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("antecedentes_patologicos_familiares") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Alergias</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("alergias") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Medicamentos actuales</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("medicamentos_actuales") || "Sin datos"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Examen clinico</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Resumen clinico</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("examen_clinico") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Halitosis</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("examen_halitosis") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Carrillos</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("examen_carrillos") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Paladar / Torus</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("examen_paladar_torus") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Piso de boca</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("examen_piso_boca") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Lengua</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("examen_lengua") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Maxilares</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("examen_maxilares") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Encias</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("examen_encias") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Bruxismo</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("examen_bruxismo") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Dientes</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("examen_dientes") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">ATM</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("examen_atm") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Oclusion</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("examen_oclusion") || "Sin datos"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Diagnostico y plan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Diagnostico</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("diagnostico") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Diagnostico diferencial</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("diagnostico_diferencial") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Plan de tratamiento</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("plan_tratamiento") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Recomendaciones</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("recomendaciones") || "Sin datos"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label className="w-48 text-left pt-2">Observaciones</Label>
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap text-sm">{getTextValue("observaciones") || "Sin datos"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              // Formulario para crear nueva historia
              <form onSubmit={handleSubmit} className="space-y-6 p-6 flex flex-col min-h-0 flex-1">
                <Card>
                  
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Clínica</Label>
                      <Select
                        value={form.idClinica || undefined}
                        onValueChange={(value) => updateField('idClinica', value)}
                        disabled={loading}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder={loading ? 'Cargando clínicas...' : 'Selecciona clínica'} />
                        </SelectTrigger>
                        <SelectContent>
                          {clinicas.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {clinicas.length === 0 && (
                        <p className="text-sm text-muted-foreground mt-1">No hay clínicas disponibles en tu tenant o están inactivas. Contacta al administrador.</p>
                      )}
                    </div>
                    <div>
                      <Label>Cita</Label>
                      <Select
                        value={form.idCita || undefined}
                        onValueChange={(value) => updateField('idCita', value)}
                        disabled={!form.idPaciente || loadingCitas || citasDisponibles.length === 0}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue
                            placeholder={
                              !form.idPaciente
                                ? 'Selecciona primero un paciente'
                                : loadingCitas
                                  ? 'Buscando citas...'
                                  : citasDisponibles.length === 0
                                    ? 'Sin citas agendadas para vincular'
                                    : 'Selecciona cita'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={EMPTY_OPTION_VALUE}>Sin cita</SelectItem>
                          {citasDisponibles.map((cita) => {
                            const fecha = formatFecha(cita.fecha_hora);
                            const consultorio = cita.consultorio?.nombre || "";
                            const odontologoNombre = cita.odontologo?.nombre || 
                              `${cita.odontologo?.nombres || ""} ${cita.odontologo?.apellidos || ""}`.trim();
                            
                            let displayText = fecha;
                            if (consultorio || odontologoNombre) {
                              const parts = [fecha];
                              if (consultorio) parts.push(`Consultorio: ${consultorio}`);
                              if (odontologoNombre) parts.push(`Dr. ${odontologoNombre}`);
                              displayText = parts.join(" - ");
                            }
                            
                            return (
                              <SelectItem key={cita.id_cita} value={String(cita.id_cita)}>
                                {displayText}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
            </CardContent>
          </Card>

          <Card className="flex-1 flex flex-col min-h-0">
            <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <Tabs defaultValue="antecedentes" className="w-full flex flex-col flex-1 min-h-0">
                <TabsList className="w-full flex-shrink-0">
                  <TabsTrigger value="antecedentes">Antecedentes Patológicos Personales</TabsTrigger>
                  <TabsTrigger value="antecedentes-habitos">Examen IntraOral</TabsTrigger>
                  <TabsTrigger value="tratamiento-endodoncia">Tratamiento de Endodoncia</TabsTrigger>
                  <TabsTrigger value="tratamiento-implante">Tratamiento Implante Dental</TabsTrigger>
                  <TabsTrigger value="tratamiento">Tratamiento</TabsTrigger>
                </TabsList>
                
                <TabsContent value="antecedentes" className="space-y-4 mt-4 flex-1 overflow-y-auto min-h-0">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <Label>Antecedentes cardíacos</Label>
                      <Select
                        value={form.antecedentesCardiacos ?? EMPTY_OPTION_VALUE}
                        onValueChange={(value) =>
                          setForm((prev) => ({
                            ...prev,
                            antecedentesCardiacos: value === EMPTY_OPTION_VALUE ? null : value,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          {RESPUESTA_BINARIA_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-5">
                      <Label>Detalle antecedentes cardíacos</Label>
                      <Textarea
                        rows={2}
                        className="min-h-0"
                        value={form.antecedentesCardiacosDetalle}
                        onChange={(e) => updateField('antecedentesCardiacosDetalle', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <Label>Alteración presión</Label>
                      <Select
                        value={form.alteracionPresion ?? EMPTY_OPTION_VALUE}
                        onValueChange={(value) =>
                          setForm((prev) => ({
                            ...prev,
                            alteracionPresion: value === EMPTY_OPTION_VALUE ? null : value,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALTERACION_PRESION_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-5">
                      <Label>Detalle presión arterial</Label>
                      <Textarea
                        rows={2}
                        className="min-h-0"
                        value={form.presionDetalle}
                        onChange={(e) => updateField('presionDetalle', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <Label>Detalles generales</Label>
                    </div>
                    <div className="md:col-span-5">
                      <Textarea
                        rows={2}
                        className="min-h-0"
                        value={form.detallesGenerales}
                        onChange={(e) => updateField('detallesGenerales', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <Label>Motivo de consulta</Label>
                    </div>
                    <div className="md:col-span-5">
                      <Textarea
                        rows={2}
                        className="min-h-0"
                        value={form.motivoConsulta}
                        onChange={(e) => updateField('motivoConsulta', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <Label>Alergias</Label>
                    </div>
                    <div className="md:col-span-5">
                      <Textarea
                        rows={2}
                        className="min-h-0"
                        value={form.alergias}
                        onChange={(e) => updateField('alergias', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <Label>Medicamentos actuales</Label>
                    </div>
                    <div className="md:col-span-5">
                      <Textarea
                        rows={2}
                        className="min-h-0"
                        value={form.medicamentosActuales}
                        onChange={(e) => updateField('medicamentosActuales', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <Label>Hábitos</Label>
                    </div>
                    <div className="md:col-span-5">
                      <Textarea
                        rows={2}
                        className="min-h-0"
                        value={form.habitos}
                        onChange={(e) => updateField('habitos', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <Label>Observaciones</Label>
                    </div>
                    <div className="md:col-span-5">
                      <Textarea
                        rows={2}
                        className="min-h-0"
                        value={form.observaciones}
                        onChange={(e) => updateField('observaciones', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <Label>Antecedentes patológicos familiares</Label>
                    </div>
                    <div className="md:col-span-5">
                      <Textarea
                        rows={2}
                        className="min-h-0"
                        value={form.antecedentesPatologicosFamiliares}
                        onChange={(e) => updateField('antecedentesPatologicosFamiliares', e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="antecedentes-habitos" className="space-y-4 mt-4 flex-1 overflow-y-auto min-h-0">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <Label>Resumen clínico</Label>
                    </div>
                    <div className="md:col-span-5">
                      <Textarea
                        rows={2}
                        className="min-h-0"
                        value={form.examenClinico}
                        onChange={(e) => updateField('examenClinico', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <Label>Halitosis</Label>
                    </div>
                    <div className="md:col-span-5">
                      <Textarea
                        rows={2}
                        className="min-h-0"
                        value={form.examenHalitosis}
                        onChange={(e) => updateField('examenHalitosis', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <Label>Carrillos</Label>
                    </div>
                    <div className="md:col-span-5">
                      <Textarea
                        rows={2}
                        className="min-h-0"
                        value={form.examenCarrillos}
                        onChange={(e) => updateField('examenCarrillos', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <Label>Paladar / Torus</Label>
                    </div>
                    <div className="md:col-span-5">
                      <Textarea
                        rows={2}
                        className="min-h-0"
                        value={form.examenPaladarTorus}
                        onChange={(e) => updateField('examenPaladarTorus', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <Label>Piso de boca</Label>
                    </div>
                    <div className="md:col-span-5">
                      <Textarea
                        rows={2}
                        className="min-h-0"
                        value={form.examenPisoBoca}
                        onChange={(e) => updateField('examenPisoBoca', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <Label>Lengua</Label>
                    </div>
                    <div className="md:col-span-5">
                      <Textarea
                        rows={2}
                        className="min-h-0"
                        value={form.examenLengua}
                        onChange={(e) => updateField('examenLengua', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <Label>Maxilares</Label>
                    </div>
                    <div className="md:col-span-5">
                      <Textarea
                        rows={2}
                        className="min-h-0"
                        value={form.examenMaxilares}
                        onChange={(e) => updateField('examenMaxilares', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <Label>Encías</Label>
                    </div>
                    <div className="md:col-span-5">
                      <Textarea
                        rows={2}
                        className="min-h-0"
                        value={form.examenEncias}
                        onChange={(e) => updateField('examenEncias', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <Label>Bruxismo</Label>
                    </div>
                    <div className="md:col-span-5">
                      <Textarea
                        rows={2}
                        className="min-h-0"
                        value={form.examenBruxismo}
                        onChange={(e) => updateField('examenBruxismo', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <Label>Dientes</Label>
                    </div>
                    <div className="md:col-span-5">
                      <Textarea
                        rows={2}
                        className="min-h-0"
                        value={form.examenDientes}
                        onChange={(e) => updateField('examenDientes', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <Label>ATM</Label>
                    </div>
                    <div className="md:col-span-5">
                      <Textarea
                        rows={2}
                        className="min-h-0"
                        value={form.examenAtm}
                        onChange={(e) => updateField('examenAtm', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <Label>Oclusión</Label>
                    </div>
                    <div className="md:col-span-5">
                      <Textarea
                        rows={2}
                        className="min-h-0"
                        value={form.examenOclusion}
                        onChange={(e) => updateField('examenOclusion', e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tratamiento-endodoncia" className="space-y-4 mt-4 flex-1 overflow-y-auto min-h-0">
                  {/* Contenido de Tratamiento de Endodoncia - Pendiente de implementación */}
                </TabsContent>

                <TabsContent value="tratamiento-implante" className="space-y-4 mt-4 flex-1 overflow-y-auto min-h-0">
                  {/* Contenido de Tratamiento Implante Dental - Pendiente de implementación */}
                </TabsContent>

                <TabsContent value="tratamiento" className="space-y-4 mt-4 flex-1 overflow-y-auto min-h-0">
                  {/* Contenido de Tratamiento - Pendiente de implementación */}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 flex-shrink-0 pt-4 pb-6 px-6">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="button" variant="outline" onClick={() => setForm(initialForm)}>
              Limpiar
            </Button>
            <Button type="submit" disabled={saving || !form.idPaciente || !form.idClinica}>
              {saving ? 'Guardando...' : 'Crear historia clínica'}
            </Button>
          </div>
            </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewMedicalRecordModal;

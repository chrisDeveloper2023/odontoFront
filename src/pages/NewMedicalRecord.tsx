
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/api/client";
import { formatGuayaquilDate, formatGuayaquilTimeHM } from "@/lib/timezone";

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
type CitaOption = { id_cita: number; fecha_hora?: string; estado?: string };

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
  alergias: string;
  medicamentosActuales: string;
  observaciones: string;
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
  alergias: "",
  medicamentosActuales: "",
  observaciones: "",
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

const NewMedicalRecord = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPatient = searchParams.get("patientId") || "";

  const [patients, setPatients] = useState<Option[]>([]);
  const [clinicas, setClinicas] = useState<Option[]>([]);
  const [citasDisponibles, setCitasDisponibles] = useState<CitaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({ ...initialForm, idPaciente: preselectedPatient });

  useEffect(() => {
    const loadBasics = async () => {
      try {
        setLoading(true);
        const [pacRes, clinRes] = await Promise.all([
          apiGet<any>('/pacientes', { page: 1, limit: 100 }),
          apiGet<any>('/clinicas', { page: 1, limit: 100 }),
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

        const mapClinicas = (raw: any): Option[] => {
          if (!raw) return [];
          const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
          return list
            .map((item: any) => ({
              id: Number(item.id ?? item.id_clinica ?? 0),
              nombre: item.nombre ?? item.nombre_clinica ?? item.alias ?? `Cl?nica ${item.id ?? ''}`,
            }))
            .filter((opt) => Number.isFinite(opt.id));
        };

        setPatients(mapRows(pacRes));
        setClinicas(mapClinicas(clinRes));
      } catch (error) {
        console.error(error);
        toast.error('No se pudieron cargar pacientes o cl?nicas');
      } finally {
        setLoading(false);
      }
    };
    loadBasics();
  }, []);

  useEffect(() => {
    if (!form.idPaciente) {
      setCitasDisponibles([]);
      return;
    }
    const loadCitas = async () => {
      try {
        setLoadingCitas(true);
        const res = await apiGet<any>(`/pacientes/${form.idPaciente}/citas-disponibles`);
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setCitasDisponibles(list as CitaOption[]);
      } catch (error) {
        console.error(error);
        setCitasDisponibles([]);
      } finally {
        setLoadingCitas(false);
      }
    };
    loadCitas();
  }, [form.idPaciente]);

  const updateField = (field: keyof typeof form, value: string) => {
    const normalizedValue =
      field === 'idCita' && value === EMPTY_OPTION_VALUE
        ? ''
        : value;
    setForm((prev) => ({ ...prev, [field]: normalizedValue }));
    if (field === 'idPaciente') {
      setForm((prev) => ({ ...prev, idPaciente: normalizedValue, idCita: '' }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.idPaciente || !form.idClinica) {
      toast.error('Selecciona paciente y cl?nica');
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
        alergias: form.alergias || null,
        medicamentos_actuales: form.medicamentosActuales || null,
        observaciones: form.observaciones || null,
      };

      const res = await apiPost<any>(`/pacientes/${form.idPaciente}/historias-clinicas`, payload);
      const historiaId = res?.id_historia ?? res?.id;
      toast.success('Historia cl?nica creada correctamente');
      if (historiaId) {
        navigate(`/medical-records/${historiaId}`);
      } else {
        navigate('/medical-records');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'No se pudo crear la historia cl?nica');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>Volver</Button>
        <div>
          <h1 className="text-3xl font-bold">Nueva Historia Cl?nica</h1>
          <p className="text-muted-foreground">Asocia paciente y registra informaci?n relevante</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Paciente y Cl?nica</CardTitle>
            <CardDescription>Selecciona los datos b?sicos para la historia</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Paciente *</Label>
              <Select
                value={form.idPaciente || undefined}
                onValueChange={(value) => updateField('idPaciente', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loading ? 'Cargando pacientes?' : 'Selecciona paciente'} />
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
            <div>
              <Label>Cl?nica *</Label>
              <Select
                value={form.idClinica || undefined}
                onValueChange={(value) => updateField('idClinica', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loading ? 'Cargando cl?nicas?' : 'Selecciona cl?nica'} />
                </SelectTrigger>
                <SelectContent>
                  {clinicas.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Cita asociada (opcional)</Label>
              <Select
                value={form.idCita || undefined}
                onValueChange={(value) => updateField('idCita', value)}
                disabled={!form.idPaciente || loadingCitas || citasDisponibles.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !form.idPaciente
                        ? 'Selecciona primero un paciente'
                        : loadingCitas
                          ? 'Buscando citas?'
                          : citasDisponibles.length === 0
                            ? 'Sin citas agendadas para vincular'
                            : 'Selecciona cita'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_OPTION_VALUE}>Sin cita</SelectItem>
                  {citasDisponibles.map((cita) => (
                    <SelectItem key={cita.id_cita} value={String(cita.id_cita)}>
                      #{cita.id_cita} ? {cita.estado ?? 'AGENDADA'} ? {formatFecha(cita.fecha_hora)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informaci?n cl?nica</CardTitle>
            <CardDescription>Completa la informaci?n relevante del paciente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Antecedentes cardiacos</Label>
              <Select
                value={form.antecedentesCardiacos ?? EMPTY_OPTION_VALUE}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    antecedentesCardiacos: value === EMPTY_OPTION_VALUE ? null : value,
                  }))
                }
              >
                  <SelectTrigger>
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
              <div>
                <Label>Alteraci?n de presi?n</Label>
                <Select
                  value={form.alteracionPresion ?? EMPTY_OPTION_VALUE}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      alteracionPresion: value === EMPTY_OPTION_VALUE ? null : value,
                    }))
                  }
                >
                  <SelectTrigger>
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Detalle antecedentes cardiacos</Label>
                <Textarea
                  rows={3}
                  value={form.antecedentesCardiacosDetalle}
                  onChange={(e) => updateField('antecedentesCardiacosDetalle', e.target.value)}
                />
              </div>
              <div>
                <Label>Detalle presi?n arterial</Label>
                <Textarea
                  rows={3}
                  value={form.presionDetalle}
                  onChange={(e) => updateField('presionDetalle', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Detalles generales</Label>
              <Textarea
                rows={4}
                value={form.detallesGenerales}
                onChange={(e) => updateField('detallesGenerales', e.target.value)}
              />
            </div>
            <div>
              <Label>Motivo de consulta</Label>
              <Textarea
                rows={3}
                value={form.motivoConsulta}
                onChange={(e) => updateField('motivoConsulta', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Alergias</Label>
                <Textarea
                  rows={3}
                  value={form.alergias}
                  onChange={(e) => updateField('alergias', e.target.value)}
                />
              </div>
              <div>
                <Label>Medicamentos actuales</Label>
                <Textarea
                  rows={3}
                  value={form.medicamentosActuales}
                  onChange={(e) => updateField('medicamentosActuales', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Observaciones</Label>
              <Textarea
                rows={3}
                value={form.observaciones}
                onChange={(e) => updateField('observaciones', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => setForm(initialForm)}>
            Limpiar
          </Button>
          <Button type="submit" disabled={saving || !form.idPaciente || !form.idClinica}>
            {saving ? 'Guardando?' : 'Crear historia cl?nica'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewMedicalRecord;

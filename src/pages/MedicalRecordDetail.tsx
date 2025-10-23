
// src/pages/MedicalRecordDetail.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiDelete, apiGet, apiPut } from "@/api/client";
import VincularCitaModal from "@/components/Historias/VincularCitaModal";
import { abrirDraftOdontograma, getOdontogramaByHistoria, OdontogramaResponse } from "@/lib/api/odontograma";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import OdontogramaModal from "@/components/OdontogramaModal";

type RespuestaBinaria = "SI" | "NO" | "DESCONOCE";
type AlteracionPresion = "ALTA" | "BAJA" | "NORMAL" | "DESCONOCIDA";

type Historia = {
  id_historia: number;
  id_paciente: number;
  id_clinica: number;
  id_cita?: number | null;
  fecha_creacion?: string;
  fecha_modificacion?: string;
  detalles_generales?: string | null;
  motivo_consulta?: string | null;
  antecedentes?: string | null;
  antecedentes_cardiacos?: RespuestaBinaria | null;
  antecedentes_cardiacos_detalle?: string | null;
  alteracion_presion?: AlteracionPresion | null;
  presion_detalle?: string | null;
  trastornos_sanguineos?: string | null;
  alergias?: string | null;
  medicamentos_actuales?: string | null;
  trastornos_gastrointestinales?: string | null;
  otras_enfermedades?: string | null;
  habitos?: string | null;
  antecedentes_patologicos_familiares?: string | null;
  examen_clinico?: string | null;
  examen_halitosis?: string | null;
  examen_carrillos?: string | null;
  examen_paladar_torus?: string | null;
  examen_piso_boca?: string | null;
  examen_lengua?: string | null;
  examen_maxilares?: string | null;
  examen_encias?: string | null;
  examen_bruxismo?: string | null;
  examen_dientes?: string | null;
  examen_atm?: string | null;
  examen_oclusion?: string | null;
  diagnostico?: string | null;
  diagnostico_diferencial?: string | null;
  plan_tratamiento?: string | null;
  recomendaciones?: string | null;
  observaciones?: string | null;
};

const EMPTY_OPTION_VALUE = "__none__";

const RESPUESTA_BINARIA_OPTIONS: Array<{ value: typeof EMPTY_OPTION_VALUE | RespuestaBinaria; label: string }> = [
  { value: EMPTY_OPTION_VALUE, label: "Sin dato" },
  { value: "SI", label: "SI" },
  { value: "NO", label: "NO" },
  { value: "DESCONOCE", label: "Desconoce" },
];

const ALTERACION_PRESION_OPTIONS: Array<{ value: typeof EMPTY_OPTION_VALUE | AlteracionPresion; label: string }> = [
  { value: EMPTY_OPTION_VALUE, label: "Sin dato" },
  { value: "ALTA", label: "Alta" },
  { value: "BAJA", label: "Baja" },
  { value: "NORMAL", label: "Normal" },
  { value: "DESCONOCIDA", label: "Desconocida" },
];

const TEXT_FIELDS = [
  "detalles_generales",
  "motivo_consulta",
  "antecedentes",
  "antecedentes_cardiacos_detalle",
  "presion_detalle",
  "trastornos_sanguineos",
  "alergias",
  "medicamentos_actuales",
  "trastornos_gastrointestinales",
  "otras_enfermedades",
  "habitos",
  "antecedentes_patologicos_familiares",
  "examen_clinico",
  "examen_halitosis",
  "examen_carrillos",
  "examen_paladar_torus",
  "examen_piso_boca",
  "examen_lengua",
  "examen_maxilares",
  "examen_encias",
  "examen_bruxismo",
  "examen_dientes",
  "examen_atm",
  "examen_oclusion",
  "diagnostico",
  "diagnostico_diferencial",
  "plan_tratamiento",
  "recomendaciones",
  "observaciones",
 ] as const;

type TextFieldKey = (typeof TEXT_FIELDS)[number];

const toCamel = (value: string) => value.replace(/_([a-z])/g, (_, ch) => ch.toUpperCase());

const normalizeHistoria = (raw: any): Historia => {
  const base: Partial<Record<TextFieldKey, string | null>> = {};
  for (const field of TEXT_FIELDS) {
    const camel = toCamel(field);
    const current = raw?.[field] ?? raw?.[camel] ?? null;
    base[field] = current == null ? null : String(current);
  }
  const antecedentesCardiacos =
    (raw?.antecedentes_cardiacos ?? raw?.antecedentesCardiacos ?? null) as
      | RespuestaBinaria
      | null;
  const alteracionPresion =
    (raw?.alteracion_presion ?? raw?.alteracionPresion ?? null) as AlteracionPresion | null;

  return {
    id_historia: Number(raw?.id_historia ?? raw?.id ?? 0),
    id_paciente: Number(raw?.id_paciente ?? raw?.paciente?.id_paciente ?? 0),
    id_clinica: Number(raw?.id_clinica ?? raw?.clinica?.id_clinica ?? 0),
    id_cita: raw?.id_cita ?? raw?.cita?.id_cita ?? null,
    fecha_creacion: raw?.fecha_creacion ?? raw?.fechaCreacion ?? null,
    fecha_modificacion: raw?.fecha_modificacion ?? raw?.fechaModificacion ?? null,
    detalles_generales: base.detalles_generales ?? null,
    motivo_consulta: base.motivo_consulta ?? null,
    antecedentes: base.antecedentes ?? null,
    antecedentes_cardiacos: antecedentesCardiacos,
    antecedentes_cardiacos_detalle: base.antecedentes_cardiacos_detalle ?? null,
    alteracion_presion: alteracionPresion,
    presion_detalle: base.presion_detalle ?? null,
    trastornos_sanguineos: base.trastornos_sanguineos ?? null,
    alergias: base.alergias ?? null,
    medicamentos_actuales: base.medicamentos_actuales ?? null,
    trastornos_gastrointestinales: base.trastornos_gastrointestinales ?? null,
    otras_enfermedades: base.otras_enfermedades ?? null,
    habitos: base.habitos ?? null,
    antecedentes_patologicos_familiares: base.antecedentes_patologicos_familiares ?? null,
    examen_clinico: base.examen_clinico ?? null,
    examen_halitosis: base.examen_halitosis ?? null,
    examen_carrillos: base.examen_carrillos ?? null,
    examen_paladar_torus: base.examen_paladar_torus ?? null,
    examen_piso_boca: base.examen_piso_boca ?? null,
    examen_lengua: base.examen_lengua ?? null,
    examen_maxilares: base.examen_maxilares ?? null,
    examen_encias: base.examen_encias ?? null,
    examen_bruxismo: base.examen_bruxismo ?? null,
    examen_dientes: base.examen_dientes ?? null,
    examen_atm: base.examen_atm ?? null,
    examen_oclusion: base.examen_oclusion ?? null,
    diagnostico: base.diagnostico ?? null,
    diagnostico_diferencial: base.diagnostico_diferencial ?? null,
    plan_tratamiento: base.plan_tratamiento ?? null,
    recomendaciones: base.recomendaciones ?? null,
    observaciones: base.observaciones ?? null,
  };
};

export default function MedicalRecordDetail() {
  const params = useParams();
  const rawId = params.id;
  const id = Number(rawId);
  const hasValidId = Number.isFinite(id) && id > 0;
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("medical-records:edit");
  const canDelete = hasPermission("medical-records:delete");
  const readOnly = !canEdit;
  const [data, setData] = useState<Historia | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<Historia>>({});

  const [og, setOg] = useState<OdontogramaResponse | null>(null);
  const [ogLoading, setOgLoading] = useState(false);
  const [ogError, setOgError] = useState<string | null>(null);
  const [ogModalOpen, setOgModalOpen] = useState(false);

  const [openCita, setOpenCita] = useState(false);

  useEffect(() => {
    if (!hasValidId) {
      setError("ID de historia invalido");
      return;
    }
    setLoading(true);
    setError(null);
    apiGet<Historia>(`/historias-clinicas/${id}`)
      .then((raw) => {
        const normalized = normalizeHistoria(raw);
        setData(normalized);
        setForm(normalized);
      })
      .catch((e: any) => {
        const message = e?.status === 403 ? "No tienes acceso a esta historia clinica (403)" : e?.message || "Error al cargar historia";
        setError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, [hasValidId, id]);

  const setField = (key: keyof Historia, value: string | null) => {
    setForm((prev) => ({ ...prev, [key]: value ?? null }));
  };

  const save = async () => {
    if (!canEdit || !id) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, any> = {};
      for (const field of TEXT_FIELDS) {
        const camel = toCamel(field);
        payload[field] = form[field] ?? null;
        if (camel !== field) {
          payload[camel] = form[field] ?? null;
        }
      }
      payload.antecedentes_cardiacos = form.antecedentes_cardiacos ?? null;
      payload.alteracion_presion = form.alteracion_presion ?? null;

      const res = await apiPut<Historia>(`/historias-clinicas/${id}`, payload);
      const normalized = normalizeHistoria(res);
      setData(normalized);
      toast.success("Historia clinica guardada correctamente");
      navigate(-1);
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar");
      toast.error(e?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!canDelete) return;
    if (!id) return;
    if (!window.confirm("Eliminar esta historia clinica?")) return;
    try {
      await apiDelete(`/historias-clinicas/${id}`);
      window.history.back();
    } catch (e: any) {
      setError(e?.message || "No se pudo eliminar");
    }
  };

  const abrirOg = async (mode: "empty" | "from_last") => {
    if (!id) return;
    setOgModalOpen(true);
    setOgLoading(true);
    setOgError(null);
    setOg(null);
    try {
      const historiaId = Number(id);
      if (!Number.isFinite(historiaId)) throw new Error("ID de historia inválido");
      const r = await abrirDraftOdontograma(historiaId, mode);
      setOg(r);
    } catch (e: any) {
      const message =
        e?.message ||
        (mode === "from_last" ? "No se pudo abrir el odontograma desde el último" : "No se pudo abrir el odontograma");
      setOgError(message);
      toast.error(message);
    } finally {
      setOgLoading(false);
    }
  };

  const reloadOg = async (showToast = false) => {
    if (!id) return;
    setOgLoading(true);
    setOgError(null);
    try {
      const historiaId = Number(id);
      if (!Number.isFinite(historiaId)) throw new Error("ID de historia inválido");
      const snap = await getOdontogramaByHistoria(historiaId);
      setOg(snap);
    } catch (e: any) {
      const message = e?.message || "No se pudo recargar el odontograma";
      setOgError(message);
      if (showToast) toast.error(message);
    } finally {
      setOgLoading(false);
    }
  };

  const ensureOgDraft = async () => {
    if (!id) return;
    setOgLoading(true);
    setOgError(null);
    try {
      const historiaId = Number(id);
      if (!Number.isFinite(historiaId)) throw new Error("ID de historia inválido");
      const draft = await abrirDraftOdontograma(historiaId, "from_last");
      setOg(draft);
    } catch (e: any) {
      const message = e?.message || "No se pudo abrir el borrador del odontograma";
      setOgError(message);
      toast.error(message);
      throw e;
    } finally {
      setOgLoading(false);
    }
  };

  if (loading) return <div className="p-4">Cargando...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!hasValidId) return <div className="p-4 text-red-600">ID de historia invalido</div>;
  if (!data) return <div className="p-4">No se encontro la historia clinica</div>;

  const textValue = (key: keyof Historia) => (form[key] ?? "") as string;
  const selectValue = (key: keyof Historia) => (form[key] ?? EMPTY_OPTION_VALUE) as string;

  return (
    <div className="space-y-4 p-2">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Historia #{data.id_historia} - Paciente #{data.id_paciente} - Clinica #{data.id_clinica} - Cita {data.id_cita ?? "Sin vincular"}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOpenCita(true)} disabled={!!data.id_cita}>Vincular a cita</Button>
          <Button variant="destructive" onClick={remove}>Eliminar</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informacion general</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Detalles generales</Label>
            <Textarea className="flex-1" rows={4} readOnly={readOnly} value={textValue("detalles_generales")} onChange={(e) => setField("detalles_generales", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Motivo de consulta</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("motivo_consulta")} onChange={(e) => setField("motivo_consulta", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Antecedentes relevantes</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("antecedentes")} onChange={(e) => setField("antecedentes", e.target.value)} />
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
            <Select
              className="flex-1"
              value={selectValue("antecedentes_cardiacos")}
              onValueChange={(value) =>
                setField("antecedentes_cardiacos", value === EMPTY_OPTION_VALUE ? null : value)
              }
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {RESPUESTA_BINARIA_OPTIONS.map((opt) => (
                  <SelectItem key={`resp-${opt.value}`} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-48 text-left pt-2">Presion arterial</Label>
            <Select
              className="flex-1"
              value={selectValue("alteracion_presion")}
              onValueChange={(value) =>
                setField("alteracion_presion", value === EMPTY_OPTION_VALUE ? null : value)
              }
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {ALTERACION_PRESION_OPTIONS.map((opt) => (
                  <SelectItem key={`pres-${opt.value}`} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Detalle antecedentes cardiacos</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("antecedentes_cardiacos_detalle")} onChange={(e) => setField("antecedentes_cardiacos_detalle", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Detalle presion arterial</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("presion_detalle")} onChange={(e) => setField("presion_detalle", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Trastornos sanguineos</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("trastornos_sanguineos")} onChange={(e) => setField("trastornos_sanguineos", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Trastornos gastrointestinales</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("trastornos_gastrointestinales")} onChange={(e) => setField("trastornos_gastrointestinales", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Otras enfermedades</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("otras_enfermedades")} onChange={(e) => setField("otras_enfermedades", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Habitos</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("habitos")} onChange={(e) => setField("habitos", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Antecedentes patologicos familiares</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("antecedentes_patologicos_familiares")} onChange={(e) => setField("antecedentes_patologicos_familiares", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Alergias</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("alergias")} onChange={(e) => setField("alergias", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Medicamentos actuales</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("medicamentos_actuales")} onChange={(e) => setField("medicamentos_actuales", e.target.value)} />
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
            <Textarea className="flex-1" rows={4} readOnly={readOnly} value={textValue("examen_clinico")} onChange={(e) => setField("examen_clinico", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Halitosis</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("examen_halitosis")} onChange={(e) => setField("examen_halitosis", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Carrillos</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("examen_carrillos")} onChange={(e) => setField("examen_carrillos", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Paladar / Torus</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("examen_paladar_torus")} onChange={(e) => setField("examen_paladar_torus", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Piso de boca</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("examen_piso_boca")} onChange={(e) => setField("examen_piso_boca", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Lengua</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("examen_lengua")} onChange={(e) => setField("examen_lengua", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Maxilares</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("examen_maxilares")} onChange={(e) => setField("examen_maxilares", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Encias</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("examen_encias")} onChange={(e) => setField("examen_encias", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Bruxismo</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("examen_bruxismo")} onChange={(e) => setField("examen_bruxismo", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Dientes</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("examen_dientes")} onChange={(e) => setField("examen_dientes", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">ATM</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("examen_atm")} onChange={(e) => setField("examen_atm", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Oclusion</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("examen_oclusion")} onChange={(e) => setField("examen_oclusion", e.target.value)} />
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
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("diagnostico")} onChange={(e) => setField("diagnostico", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Diagnostico diferencial</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("diagnostico_diferencial")} onChange={(e) => setField("diagnostico_diferencial", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Plan de tratamiento</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("plan_tratamiento")} onChange={(e) => setField("plan_tratamiento", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Recomendaciones</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("recomendaciones")} onChange={(e) => setField("recomendaciones", e.target.value)} />
          </div>
          <div className="flex items-start gap-4">
            <Label className="w-48 text-left pt-2">Observaciones</Label>
            <Textarea className="flex-1" rows={3} readOnly={readOnly} value={textValue("observaciones")} onChange={(e) => setField("observaciones", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4">
        <Button variant="outline" onClick={() => abrirOg("from_last")} disabled={ogLoading}>Odontograma desde ultimo</Button>
        <Button variant="outline" onClick={() => abrirOg("empty")} disabled={ogLoading}>Odontograma vacio</Button>
        <Button onClick={save} disabled={saving}>Guardar</Button>
      </div>

      <OdontogramaModal
        open={ogModalOpen}
        onClose={() => {
          setOgModalOpen(false);
          setOgError(null);
        }}
        data={og}
        loading={ogLoading}
        error={ogError}
        historiaId={data.id_historia}
        ensureDraft={ensureOgDraft}
        onReload={() => reloadOg()}
        onRefreshRequest={() => reloadOg(true)}
      />

      <VincularCitaModal
        open={openCita}
        onOpenChange={setOpenCita}
        idPaciente={data.id_paciente}
        idHistoria={data.id_historia}
        onLinked={() => {
          apiGet<Historia>(`/historias-clinicas/${id}`)
            .then((raw) => {
              const normalized = normalizeHistoria(raw);
              setData(normalized);
              setForm(normalized);
            })
            .catch(() => undefined);
        }}
      />
    </div>
  );
}



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
import OdontogramaView from "@/components/OdontogramaView";
import { abrirDraftOdontograma, getOdontogramaByHistoria, OdontogramaResponse } from "@/lib/api/odontograma";
import { toast } from "sonner";

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

const RESPUESTA_BINARIA_OPTIONS: Array<{ value: "" | RespuestaBinaria; label: string }> = [
  { value: "", label: "Sin dato" },
  { value: "SI", label: "SI" },
  { value: "NO", label: "NO" },
  { value: "DESCONOCE", label: "Desconoce" },
];

const ALTERACION_PRESION_OPTIONS: Array<{ value: "" | AlteracionPresion; label: string }> = [
  { value: "", label: "Sin dato" },
  { value: "ALTA", label: "Alta" },
  { value: "BAJA", label: "Baja" },
  { value: "NORMAL", label: "Normal" },
  { value: "DESCONOCIDA", label: "Desconocida" },
];

const TEXT_FIELDS: Array<keyof Historia> = [
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
];

const toCamel = (value: string) => value.replace(/_([a-z])/g, (_, ch) => ch.toUpperCase());

const normalizeHistoria = (raw: any): Historia => {
  const base: Partial<Historia> = {};
  for (const field of TEXT_FIELDS) {
    const camel = toCamel(field);
    const current = raw?.[field] ?? raw?.[camel] ?? null;
    base[field] = current ?? null;
  }
  base.antecedentes_cardiacos = raw?.antecedentes_cardiacos ?? raw?.antecedentesCardiacos ?? null;
  base.alteracion_presion = raw?.alteracion_presion ?? raw?.alteracionPresion ?? null;

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
    antecedentes_cardiacos: base.antecedentes_cardiacos as RespuestaBinaria | null,
    antecedentes_cardiacos_detalle: base.antecedentes_cardiacos_detalle ?? null,
    alteracion_presion: base.alteracion_presion as AlteracionPresion | null,
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
  const [data, setData] = useState<Historia | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<Historia>>({});

  const [og, setOg] = useState<OdontogramaResponse | null>(null);
  const [ogLoading, setOgLoading] = useState(false);
  const [ogError, setOgError] = useState<string | null>(null);

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
      .catch((e: any) => setError(e?.message || "Error al cargar historia"))
      .finally(() => setLoading(false));
  }, [hasValidId, id]);

  const setField = (key: keyof Historia, value: string | null) => {
    setForm((prev) => ({ ...prev, [key]: value ?? null }));
  };

  const save = async () => {
    if (!id) return;
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
    setOgLoading(true);
    setOgError(null);
    try {
      const r = await abrirDraftOdontograma(id, mode);
      setOg(r);
    } catch (e: any) {
      setOgError(e?.message || "No se pudo abrir el odontograma");
    } finally {
      setOgLoading(false);
    }
  };

  const reloadOg = async () => {
    if (!id) return;
    try {
      const snap = await getOdontogramaByHistoria(String(id));
      setOg(snap);
    } catch {
      /* noop */
    }
  };

  if (loading) return <div className="p-4">Cargando...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!hasValidId) return <div className="p-4 text-red-600">ID de historia invalido</div>;
  if (!data) return <div className="p-4">No se encontro la historia clinica</div>;

  const textValue = (key: keyof Historia) => (form[key] ?? "") as string;
  const selectValue = (key: keyof Historia) => (form[key] ?? "") as string;

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
          <div>
            <Label>Detalles generales</Label>
            <Textarea rows={4} value={textValue("detalles_generales")} onChange={(e) => setField("detalles_generales", e.target.value)} />
          </div>
          <div>
            <Label>Motivo de consulta</Label>
            <Textarea rows={3} value={textValue("motivo_consulta")} onChange={(e) => setField("motivo_consulta", e.target.value)} />
          </div>
          <div>
            <Label>Antecedentes relevantes</Label>
            <Textarea rows={3} value={textValue("antecedentes")} onChange={(e) => setField("antecedentes", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Antecedentes y habitos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Antecedentes cardiacos</Label>
              <Select value={selectValue("antecedentes_cardiacos")} onValueChange={(value) => setField("antecedentes_cardiacos", value || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {RESPUESTA_BINARIA_OPTIONS.map((opt) => (
                    <SelectItem key={`resp-${opt.value || "empty"}`} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Presion arterial</Label>
              <Select value={selectValue("alteracion_presion")} onValueChange={(value) => setField("alteracion_presion", value || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {ALTERACION_PRESION_OPTIONS.map((opt) => (
                    <SelectItem key={`pres-${opt.value || "empty"}`} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Detalle antecedentes cardiacos</Label>
              <Textarea rows={3} value={textValue("antecedentes_cardiacos_detalle")} onChange={(e) => setField("antecedentes_cardiacos_detalle", e.target.value)} />
            </div>
            <div>
              <Label>Detalle presion arterial</Label>
              <Textarea rows={3} value={textValue("presion_detalle")} onChange={(e) => setField("presion_detalle", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Trastornos sanguineos</Label>
              <Textarea rows={3} value={textValue("trastornos_sanguineos")} onChange={(e) => setField("trastornos_sanguineos", e.target.value)} />
            </div>
            <div>
              <Label>Trastornos gastrointestinales</Label>
              <Textarea rows={3} value={textValue("trastornos_gastrointestinales")} onChange={(e) => setField("trastornos_gastrointestinales", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Otras enfermedades</Label>
              <Textarea rows={3} value={textValue("otras_enfermedades")} onChange={(e) => setField("otras_enfermedades", e.target.value)} />
            </div>
            <div>
              <Label>Habitos</Label>
              <Textarea rows={3} value={textValue("habitos")} onChange={(e) => setField("habitos", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Antecedentes patologicos familiares</Label>
            <Textarea rows={3} value={textValue("antecedentes_patologicos_familiares")} onChange={(e) => setField("antecedentes_patologicos_familiares", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Alergias</Label>
              <Textarea rows={3} value={textValue("alergias")} onChange={(e) => setField("alergias", e.target.value)} />
            </div>
            <div>
              <Label>Medicamentos actuales</Label>
              <Textarea rows={3} value={textValue("medicamentos_actuales")} onChange={(e) => setField("medicamentos_actuales", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Examen clinico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Resumen clinico</Label>
            <Textarea rows={4} value={textValue("examen_clinico")} onChange={(e) => setField("examen_clinico", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Halitosis</Label>
              <Textarea rows={3} value={textValue("examen_halitosis")} onChange={(e) => setField("examen_halitosis", e.target.value)} />
            </div>
            <div>
              <Label>Carrillos</Label>
              <Textarea rows={3} value={textValue("examen_carrillos")} onChange={(e) => setField("examen_carrillos", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Paladar / Torus</Label>
              <Textarea rows={3} value={textValue("examen_paladar_torus")} onChange={(e) => setField("examen_paladar_torus", e.target.value)} />
            </div>
            <div>
              <Label>Piso de boca</Label>
              <Textarea rows={3} value={textValue("examen_piso_boca")} onChange={(e) => setField("examen_piso_boca", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Lengua</Label>
              <Textarea rows={3} value={textValue("examen_lengua")} onChange={(e) => setField("examen_lengua", e.target.value)} />
            </div>
            <div>
              <Label>Maxilares</Label>
              <Textarea rows={3} value={textValue("examen_maxilares")} onChange={(e) => setField("examen_maxilares", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Encias</Label>
              <Textarea rows={3} value={textValue("examen_encias")} onChange={(e) => setField("examen_encias", e.target.value)} />
            </div>
            <div>
              <Label>Bruxismo</Label>
              <Textarea rows={3} value={textValue("examen_bruxismo")} onChange={(e) => setField("examen_bruxismo", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Dientes</Label>
              <Textarea rows={3} value={textValue("examen_dientes")} onChange={(e) => setField("examen_dientes", e.target.value)} />
            </div>
            <div>
              <Label>ATM</Label>
              <Textarea rows={3} value={textValue("examen_atm")} onChange={(e) => setField("examen_atm", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Oclusion</Label>
            <Textarea rows={3} value={textValue("examen_oclusion")} onChange={(e) => setField("examen_oclusion", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Diagnostico y plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Diagnostico</Label>
            <Textarea rows={3} value={textValue("diagnostico")} onChange={(e) => setField("diagnostico", e.target.value)} />
          </div>
          <div>
            <Label>Diagnostico diferencial</Label>
            <Textarea rows={3} value={textValue("diagnostico_diferencial")} onChange={(e) => setField("diagnostico_diferencial", e.target.value)} />
          </div>
          <div>
            <Label>Plan de tratamiento</Label>
            <Textarea rows={3} value={textValue("plan_tratamiento")} onChange={(e) => setField("plan_tratamiento", e.target.value)} />
          </div>
          <div>
            <Label>Recomendaciones</Label>
            <Textarea rows={3} value={textValue("recomendaciones")} onChange={(e) => setField("recomendaciones", e.target.value)} />
          </div>
          <div>
            <Label>Observaciones</Label>
            <Textarea rows={3} value={textValue("observaciones")} onChange={(e) => setField("observaciones", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4">
        <Button variant="outline" onClick={() => abrirOg("from_last")} disabled={ogLoading}>Odontograma desde ultimo</Button>
        <Button variant="outline" onClick={() => abrirOg("empty")} disabled={ogLoading}>Odontograma vacio</Button>
        <Button onClick={save} disabled={saving}>Guardar</Button>
      </div>

      {ogError && <div className="text-sm text-red-600">{ogError}</div>}
      {og && (
        <div className="border-t pt-4">
          <OdontogramaView data={og} draftCtx={{ historiaId: data.id_historia }} onReload={reloadOg} />
        </div>
      )}

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

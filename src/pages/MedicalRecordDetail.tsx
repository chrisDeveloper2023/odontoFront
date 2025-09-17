// src/pages/MedicalRecordDetail.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiDelete, apiGet, apiPut } from "@/api/client";
import VincularCitaModal from "@/components/Historias/VincularCitaModal";
import OdontogramaView from "@/components/OdontogramaView";
import { abrirDraftOdontograma, getOdontogramaByHistoria, OdontogramaResponse } from "@/lib/api/odontograma";
import { toast } from "sonner";

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
  alergias?: string | null;
  medicamentos_actuales?: string | null;
  examen_clinico?: string | null;
  diagnostico?: string | null;
  diagnostico_diferencial?: string | null;
  plan_tratamiento?: string | null;
  recomendaciones?: string | null;
  observaciones?: string | null;
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

  // Campos editables
  const [form, setForm] = useState<Partial<Historia>>({});

  // Odontograma embed
  const [og, setOg] = useState<OdontogramaResponse | null>(null);
  const [ogLoading, setOgLoading] = useState(false);
  const [ogError, setOgError] = useState<string | null>(null);

  // Vincular cita modal
  const [openCita, setOpenCita] = useState(false);

  useEffect(() => {
    if (!hasValidId) {
      setError("ID de historia inválido");
      return;
    }
    setLoading(true);
    setError(null);
    apiGet<Historia>(`/historias-clinicas/${id}`)
      .then((h) => {
        setData(h);
        setForm(h || {});
      })
      .catch((e: any) => setError(e?.message || "Error al cargar historia"))
      .finally(() => setLoading(false));
  }, [hasValidId, id]);

  const onChange = (k: keyof Historia, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        detalles_generales: form.detalles_generales ?? null,
        motivo_consulta: form.motivo_consulta ?? null,
        antecedentes: form.antecedentes ?? null,
        alergias: form.alergias ?? null,
        medicamentos_actuales: form.medicamentos_actuales ?? null,
        examen_clinico: form.examen_clinico ?? null,
        diagnostico: form.diagnostico ?? null,
        diagnostico_diferencial: form.diagnostico_diferencial ?? null,
        plan_tratamiento: form.plan_tratamiento ?? null,
        recomendaciones: form.recomendaciones ?? null,
        observaciones: form.observaciones ?? null,
      };
      const res = await apiPut<Historia>(`/historias-clinicas/${id}`, body);
      setData(res);
      toast.success("Historia clínica guardada correctamente");
      // Si está en modal, volver cierra el modal (RouteModal usa navigate(-1))
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
    if (!window.confirm("¿Eliminar esta historia clínica?")) return;
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
      /* ignore */
    }
  };

  if (loading) return <div className="p-4">Cargando…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!hasValidId) return <div className="p-4 text-red-600">ID de historia inválido</div>;
  if (!data) return <div className="p-4">No se encontró la historia clínica</div>;

  const sections: Array<[keyof Historia, string]> = [
    ["detalles_generales", "Detalles Generales"],
    ["motivo_consulta", "Motivo de Consulta"],
    ["antecedentes", "Antecedentes"],
    ["alergias", "Alergias"],
    ["medicamentos_actuales", "Medicamentos Actuales"],
    ["examen_clinico", "Examen Clínico"],
    ["diagnostico", "Diagnóstico"],
    ["diagnostico_diferencial", "Diagnóstico Diferencial"],
    ["plan_tratamiento", "Plan de Tratamiento"],
    ["recomendaciones", "Recomendaciones"],
    ["observaciones", "Observaciones"],
  ];

  return (
    <div className="space-y-4 p-2">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Historia #{data.id_historia} · Paciente #{data.id_paciente} · Clínica #{data.id_clinica} · Cita {data.id_cita ?? "—"}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOpenCita(true)} disabled={!!data.id_cita}>Vincular a cita</Button>
          <Button variant="destructive" onClick={remove}>Eliminar</Button>
        </div>
      </div>

      {sections.map(([key, label]) => (
        <Card key={key as string}>
          <CardHeader>
            <CardTitle className="text-base">{label}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={4}
              value={(form[key] as any) ?? ""}
              onChange={(e) => onChange(key, e.target.value)}
            />
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end gap-2 sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4">
        <Button variant="outline" onClick={() => abrirOg("from_last")} disabled={ogLoading}>Odontograma desde último</Button>
        <Button variant="outline" onClick={() => abrirOg("empty")} disabled={ogLoading}>Odontograma vacío</Button>
        <Button onClick={save} disabled={saving}>Guardar</Button>
      </div>

      {ogError && <div className="text-sm text-red-600">{ogError}</div>}
      {og && (
        <div className="border-t pt-4">
          <OdontogramaView
            data={og}
            draftCtx={{ historiaId: data.id_historia }}
            onReload={reloadOg}
          />
        </div>
      )}

      <VincularCitaModal
        open={openCita}
        onOpenChange={setOpenCita}
        idPaciente={data.id_paciente}
        idHistoria={data.id_historia}
        onLinked={() => {
          // recargar
          apiGet<Historia>(`/historias-clinicas/${id}`).then(setData).catch(() => void 0);
        }}
      />
    </div>
  );
}

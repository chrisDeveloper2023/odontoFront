import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/api/client";
import { getClinicas } from "@/lib/api/clinicas";
import { formatGuayaquilDate, formatGuayaquilTimeHM } from "@/lib/timezone";

export type Option = { id: number; nombre: string };
export type CitaOption = { id_cita: number; fecha_hora?: string; estado?: string };

export type FormState = {
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
  habitos: string;
  observaciones: string;
};

export const EMPTY_OPTION_VALUE = "__none__";

export const RESPUESTA_BINARIA_OPTIONS = [
  { value: EMPTY_OPTION_VALUE, label: "Sin dato" },
  { value: "SI", label: "SI" },
  { value: "NO", label: "NO" },
  { value: "DESCONOCE", label: "Desconoce" },
] as const;

export const ALTERACION_PRESION_OPTIONS = [
  { value: EMPTY_OPTION_VALUE, label: "Sin dato" },
  { value: "ALTA", label: "Alta" },
  { value: "BAJA", label: "Baja" },
  { value: "NORMAL", label: "Normal" },
  { value: "DESCONOCIDA", label: "Desconocida" },
] as const;

const BASE_FORM: FormState = {
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
  habitos: "",
  observaciones: "",
};

export const formatFecha = (iso?: string) => {
  if (!iso) return "";
  const fecha = formatGuayaquilDate(iso, { dateStyle: "medium" });
  const hora = formatGuayaquilTimeHM(iso);
  if (fecha && hora) return `${fecha} ${hora}`;
  if (fecha) return fecha;
  if (hora) return hora;
  return iso;
};

export interface UseNewMedicalRecordFormOptions {
  active: boolean;
  preselectedPatientId?: string;
}

function mapOptions(raw: any): Option[] {
  if (!raw) return [];
  const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
  return list
    .map((item: any) => ({
      id: Number(item.id_paciente ?? item.id ?? item.idPaciente ?? 0),
      nombre: `${item.nombres ?? item.nombre ?? ""} ${item.apellidos ?? ""}`.trim() || String(item.id ?? ""),
    }))
    .filter((opt: Option) => Number.isFinite(opt.id));
}

function mapClinicas(raw: any): Option[] {
  if (!raw) return [];
  const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
  return list
    .map((item: any) => ({
      id: Number(item.id ?? item.id_clinica ?? item.idClinica ?? item.clinica_id),
      nombre: item.nombre ?? item.nombre_clinica ?? item.alias ?? item.name ?? `Clinica ${item.id ?? ""}`,
    }))
    .filter((opt: Option) => Number.isFinite(opt.id));
}

export function useNewMedicalRecordForm({
  active,
  preselectedPatientId = "",
}: UseNewMedicalRecordFormOptions) {
  const [patients, setPatients] = useState<Option[]>([]);
  const [clinicas, setClinicas] = useState<Option[]>([]);
  const [citasDisponibles, setCitasDisponibles] = useState<CitaOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(() => ({ ...BASE_FORM, idPaciente: preselectedPatientId }));

  const activeRef = useRef<boolean>(active);
  activeRef.current = active;

  const resetForm = useCallback(
    () => {
      setForm({ ...BASE_FORM, idPaciente: preselectedPatientId });
      setCitasDisponibles([]);
    },
    [preselectedPatientId],
  );

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([apiGet<any>("/pacientes", { page: 1, limit: 200 }), getClinicas()])
      .then(([pacRes, clinRes]) => {
        if (cancelled) return;
        setPatients(mapOptions(pacRes));
        setClinicas(mapClinicas(clinRes));
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) {
          setPatients([]);
          setClinicas([]);
          toast.error("No se pudieron cargar pacientes o clínicas");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    setForm((prev) => ({ ...prev, idPaciente: preselectedPatientId }));
  }, [preselectedPatientId, active]);

  useEffect(() => {
    if (!active) return;
    if (!form.idPaciente) {
      setCitasDisponibles([]);
      return;
    }

    let cancelled = false;
    setLoadingCitas(true);
    apiGet<any>(`/pacientes/${form.idPaciente}/citas-disponibles`)
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setCitasDisponibles(list as CitaOption[]);
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setCitasDisponibles([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCitas(false);
      });

    return () => {
      cancelled = true;
    };
  }, [active, form.idPaciente]);

  const updateField = useCallback((field: keyof FormState, value: string) => {
    setForm((prev) => {
      const normalized = field === "idCita" && value === EMPTY_OPTION_VALUE ? "" : value;
      if (field === "idPaciente") {
        return { ...prev, idPaciente: normalized, idCita: "" };
      }
      return { ...prev, [field]: normalized };
    });
  }, []);

  const submit = useCallback(async (): Promise<any | null> => {
    if (!form.idPaciente || !form.idClinica) {
      toast.error("Selecciona paciente y clínica");
      return null;
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
        habitos: form.habitos || null,
        observaciones: form.observaciones || null,
      };

      const response = await apiPost<any>(`/pacientes/${form.idPaciente}/historias-clinicas`, payload);
      toast.success("Historia clínica creada correctamente");
      resetForm();
      return response;
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "No se pudo crear la historia clínica");
      return null;
    } finally {
      setSaving(false);
    }
  }, [form, resetForm]);

  return {
    form,
    patients,
    clinicas,
    citasDisponibles,
    loading,
    loadingCitas,
    saving,
    updateField,
    submit,
    resetForm,
  };
}


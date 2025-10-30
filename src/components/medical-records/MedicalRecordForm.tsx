import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import type {
  CitaOption,
  FormState,
  Option,
} from "@/components/medical-records/useNewMedicalRecordForm";
import {
  ALTERACION_PRESION_OPTIONS,
  EMPTY_OPTION_VALUE,
  RESPUESTA_BINARIA_OPTIONS,
  formatFecha,
} from "@/components/medical-records/useNewMedicalRecordForm";

interface MedicalRecordFormProps {
  form: FormState;
  patients: Option[];
  clinicas: Option[];
  citasDisponibles: CitaOption[];
  loading: boolean;
  loadingCitas: boolean;
  saving: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onCancel?: () => void;
  updateField: (field: keyof FormState, value: string) => void;
  onOpenPatientSearch?: () => void;
  selectedPatientName?: string;
}

export function MedicalRecordForm({
  form,
  patients,
  clinicas,
  citasDisponibles,
  loading,
  loadingCitas,
  saving,
  onSubmit,
  onReset,
  onCancel,
  updateField,
  onOpenPatientSearch,
  selectedPatientName = "",
}: MedicalRecordFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Paciente y Clínica</CardTitle>
          <CardDescription>Selecciona los datos básicos para la historia</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Paciente *</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Selecciona un paciente"
                value={selectedPatientName}
                readOnly
                className="flex-1 cursor-pointer"
                onClick={onOpenPatientSearch}
              />
              <Button
                type="button"
                variant="outline"
                onClick={onOpenPatientSearch}
                title="Buscar paciente"
                disabled={loading}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label>Clínica *</Label>
            <Select
              value={form.idClinica}
              onValueChange={(value) => updateField("idClinica", value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Cargando clínicas..." : "Selecciona clínica"} />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {clinicas.map((option) => (
                  <SelectItem key={option.id} value={option.id.toString()}>
                    {option.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Cita asociada</Label>
            <Select
              value={form.idCita || EMPTY_OPTION_VALUE}
              onValueChange={(value) => updateField("idCita", value)}
              disabled={
                loading ||
                !form.idPaciente ||
                loadingCitas ||
                citasDisponibles.length === 0
              }
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !form.idPaciente
                      ? "Selecciona paciente primero"
                      : loadingCitas
                        ? "Cargando citas..."
                        : citasDisponibles.length
                          ? "Selecciona cita (opcional)"
                          : "Paciente sin citas disponibles"
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value={EMPTY_OPTION_VALUE}>Sin cita asociada</SelectItem>
                {citasDisponibles.map((cita) => (
                  <SelectItem key={cita.id_cita} value={String(cita.id_cita)}>
                    {`Cita ${cita.id_cita} - ${formatFecha(cita.fecha_hora)} ${cita.estado ? `(${cita.estado})` : ""}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Antecedentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Antecedentes cardíacos</Label>
              <Select
                value={form.antecedentesCardiacos ?? EMPTY_OPTION_VALUE}
                onValueChange={(value) => updateField("antecedentesCardiacos", value)}
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
              <Label>Detalle antecedentes</Label>
              <Textarea
                rows={3}
                value={form.antecedentesCardiacosDetalle}
                onChange={(e) => updateField("antecedentesCardiacosDetalle", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Alteración presión</Label>
              <Select
                value={form.alteracionPresion ?? EMPTY_OPTION_VALUE}
                onValueChange={(value) => updateField("alteracionPresion", value)}
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
            <div>
              <Label>Detalle presión arterial</Label>
              <Textarea
                rows={3}
                value={form.presionDetalle}
                onChange={(e) => updateField("presionDetalle", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalles clínicos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <Label>Detalles generales</Label>
            </div>
            <div className="md:col-span-5">
              <Textarea
                rows={4}
                value={form.detallesGenerales}
                onChange={(e) => updateField("detallesGenerales", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <Label>Motivo de consulta</Label>
            </div>
            <div className="md:col-span-5">
              <Textarea
                rows={3}
                value={form.motivoConsulta}
                onChange={(e) => updateField("motivoConsulta", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <Label>Alergias</Label>
            </div>
            <div className="md:col-span-5">
              <Textarea
                rows={3}
                value={form.alergias}
                onChange={(e) => updateField("alergias", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <Label>Medicamentos actuales</Label>
            </div>
            <div className="md:col-span-5">
              <Textarea
                rows={3}
                value={form.medicamentosActuales}
                onChange={(e) => updateField("medicamentosActuales", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <Label>Hábitos</Label>
            </div>
            <div className="md:col-span-5">
              <Textarea
                rows={3}
                value={form.habitos}
                onChange={(e) => updateField("habitos", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <Label>Observaciones</Label>
            </div>
            <div className="md:col-span-5">
              <Textarea
                rows={3}
                value={form.observaciones}
                onChange={(e) => updateField("observaciones", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onReset}>
          Limpiar
        </Button>
        <Button type="submit" disabled={saving || !form.idPaciente || !form.idClinica}>
          {saving ? "Guardando..." : "Crear historia clínica"}
        </Button>
      </div>
    </form>
  );
}


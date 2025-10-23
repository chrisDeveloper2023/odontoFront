import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, User, Stethoscope, Building } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getOdontologos } from "@/servicios/usuarios";
import { apiGet } from "@/api/client";
import { toast } from "sonner";
import { getClinicas } from "@/lib/api/clinicas";

type PatientOption = {
  id: number;
  nombre: string;
  idClinica?: number | null;
};

type ClinicOption = {
  id: number;
  nombre: string;
};

type ConsultorioOption = {
  id: number;
  nombre: string;
  idClinica?: number | null;
};

type Doctor = {
  id: number;
  nombres: string;
  apellidos: string;
};

export type NewAppointmentPayload = {
  idPaciente: number;
  pacienteNombre: string;
  idClinica: number;
  idConsultorio: number;
  idOdontologo: number;
  odontologoNombre: string;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  tipo: string;
  descripcion: string;
  color: string;
};

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: NewAppointmentPayload) => Promise<void> | void;
  odontologos?: Array<{ id: number; nombre: string; color: string }>;
  isSubmitting?: boolean;
  preselectedPatientId?: string;
}

const HORAS_DISPONIBLES = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
];

const DEFAULT_COLORS = [
  "bg-pink-500",
  "bg-yellow-500",
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
];

const DEFAULT_HORA_INICIO = "09:00";

const buildNombreCompleto = (nombres?: string | null, apellidos?: string | null) => {
  return [nombres, apellidos].filter(Boolean).join(" ").trim();
};

const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  odontologos: odontologosConfig = [],
  isSubmitting = false,
  preselectedPatientId = "",
}) => {
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [clinics, setClinics] = useState<ClinicOption[]>([]);
  const [consultorios, setConsultorios] = useState<ConsultorioOption[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [loadingDoctores, setLoadingDoctores] = useState(false);

  const calcularHoraFin = (horaInicio: string): string => {
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const totalMinutos = horas * 60 + minutos + 30; // Sumar 30 minutos
    
    const nuevasHoras = Math.floor(totalMinutos / 60);
    const nuevosMinutos = totalMinutos % 60;
    
    // Formatear con ceros a la izquierda
    const horasFormateadas = nuevasHoras.toString().padStart(2, '0');
    const minutosFormateados = nuevosMinutos.toString().padStart(2, '0');
    
    return `${horasFormateadas}:${minutosFormateados}`;
  };

  const resetFormState = () => {
    setFormData(createInitialFormData(preselectedPatientId));
  };

  const createInitialFormData = (patientId: string | undefined) => {
    const horaInicioDefault = DEFAULT_HORA_INICIO;
    return {
      pacienteId: patientId || "",
      pacienteNombre: "",
      idClinica: "",
      idConsultorio: "",
      idOdontologo: "",
      odontologoNombre: "",
      tipo: "",
      descripcion: "",
      fecha: new Date(),
      horaInicio: horaInicioDefault,
      horaFin: calcularHoraFin(horaInicioDefault),
      color: "bg-blue-500",
    };
  };

  const [formData, setFormData] = useState(() => createInitialFormData(preselectedPatientId));

  useEffect(() => {
    if (preselectedPatientId && patients.length > 0) {
      const paciente = patients.find((p) => p.id.toString() === preselectedPatientId);
      if (paciente) {
        setFormData(prev => ({
          ...prev,
          pacienteId: preselectedPatientId,
          pacienteNombre: paciente.nombre,
          idClinica: paciente.idClinica ? paciente.idClinica.toString() : "",
        }));
      }
    }
  }, [preselectedPatientId, patients]);

  useEffect(() => {
    if (!isOpen) {
      resetFormState();
      return;
    }

    const cargarCatalogos = async () => {
      setLoadingCatalogs(true);
      try {
        const [pacRes, clinRes, consRes] = await Promise.all([
          apiGet<any>("/pacientes", { page: 1, limit: 200 }),
          getClinicas(),
          apiGet<any>("/consultorios"),
        ]);

        const pacientes = Array.isArray(pacRes?.data)
          ? pacRes.data
          : Array.isArray(pacRes)
            ? pacRes
            : [];
        const clinicas = Array.isArray(clinRes) ? clinRes : [];
        const consultoriosData = Array.isArray(consRes?.data)
          ? consRes.data
          : Array.isArray(consRes)
            ? consRes
            : [];

        setPatients(
          pacientes.map((p: any) => ({
            id: Number(p.id_paciente ?? p.id ?? 0),
            nombre: buildNombreCompleto(p.nombres, p.apellidos) || `Paciente ${p.id ?? ""}`,
            idClinica: p.id_clinica ?? null,
          })).filter((p: PatientOption) => Number.isFinite(p.id))
        );

        setClinics(
          clinicas
            .map((c: any) => ({
              id: Number(c.id ?? c.id_clinica ?? c.idClinica ?? c.clinica_id),
              nombre: c.nombre ?? c.nombre_clinica ?? c.name ?? `Clinica ${c.id ?? ""}`,
            }))
            .filter((c: ClinicOption) => Number.isFinite(c.id))
        );

        setConsultorios(
          consultoriosData.map((c: any) => ({
            id: Number(c.id_consultorio ?? c.id ?? 0),
            nombre: c.nombre ?? `Consultorio ${c.id ?? ""}`,
            idClinica: c.id_clinica ?? c.clinica_id ?? null,
          })).filter((c: ConsultorioOption) => Number.isFinite(c.id))
        );
      } catch (error) {
        console.error("Error cargando catalogos", error);
        toast.error("No se pudieron cargar los catlogos");
        setPatients([]);
        setClinics([]);
        setConsultorios([]);
      } finally {
        setLoadingCatalogs(false);
      }
    };

    const cargarDoctores = async () => {
      setLoadingDoctores(true);
      try {
        const data = await getOdontologos();
        setDoctores(data);
      } catch (error) {
        console.error("Error cargando odontologos", error);
        setDoctores([]);
      } finally {
        setLoadingDoctores(false);
      }
    };

    cargarCatalogos();
    cargarDoctores();
  }, [isOpen]);

  const consultoriosFiltrados = useMemo(() => {
    if (!formData.idClinica) return consultorios;
    return consultorios.filter((c) => String(c.idClinica ?? "") === formData.idClinica);
  }, [consultorios, formData.idClinica]);

  const obtenerColorParaOdontologo = (nombreCompleto: string) => {
    const configurado = odontologosConfig.find((o) => o.nombre === nombreCompleto);
    if (configurado) return configurado.color;
    if (odontologosConfig.length > 0) {
      return odontologosConfig[0].color;
    }
    return DEFAULT_COLORS[0];
  };

  const handleFieldChange = (field: keyof typeof formData, value: string | Date) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      
      // Si se cambia la hora de inicio, calcular automáticamente la hora de fin (+30 minutos)
      if (field === "horaInicio" && typeof value === "string") {
        const horaFinCalculada = calcularHoraFin(value);
        newData.horaFin = horaFinCalculada;
      }
      
      return newData;
    });
  };

  const handlePatientChange = (value: string) => {
    const paciente = patients.find((p) => p.id.toString() === value);
    if (!paciente) return;
    handleFieldChange("pacienteId", value);
    handleFieldChange("pacienteNombre", paciente.nombre);
    handleFieldChange("idClinica", paciente.idClinica ? paciente.idClinica.toString() : "");
    handleFieldChange("idConsultorio", "");
  };

  const handleClinicaChange = (value: string) => {
    handleFieldChange("idClinica", value);
    handleFieldChange("idConsultorio", "");
  };

  const handleConsultorioChange = (value: string) => {
    handleFieldChange("idConsultorio", value);
  };

  const handleOdontologoChange = (value: string) => {
    const doctor = doctores.find((d) => d.id.toString() === value);
    if (!doctor) return;
    const nombreCompleto = buildNombreCompleto(doctor.nombres, doctor.apellidos) || `Odontologo ${doctor.id}`;
    const color = obtenerColorParaOdontologo(nombreCompleto);
    handleFieldChange("idOdontologo", value);
    handleFieldChange("odontologoNombre", nombreCompleto);
    handleFieldChange("color", color);
  };

  const handleSave = async () => {
    if (!formData.pacienteId || !formData.idClinica || !formData.idConsultorio || !formData.idOdontologo) {
      toast.error("Selecciona paciente, clinica, consultorio y medico");
      return;
    }

    const inicio = formData.horaInicio;
    const fin = formData.horaFin;
    if (inicio >= fin) {
      toast.error("La hora de fin debe ser posterior a la de inicio");
      return;
    }

    const payload: NewAppointmentPayload = {
      idPaciente: Number(formData.pacienteId),
      pacienteNombre: formData.pacienteNombre,
      idClinica: Number(formData.idClinica),
      idConsultorio: Number(formData.idConsultorio),
      idOdontologo: Number(formData.idOdontologo),
      odontologoNombre: formData.odontologoNombre,
      fecha: formData.fecha,
      horaInicio: formData.horaInicio,
      horaFin: formData.horaFin,
      tipo: formData.tipo,
      descripcion: formData.descripcion,
      color: formData.color,
    };

    try {
      await onSave(payload);
      resetFormState();
    } catch (error) {
      // el padre muestra el error
    }
  };

  const horasDisponibles = HORAS_DISPONIBLES;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Nueva Cita
          </DialogTitle>
          <DialogDescription>
            Complete los datos para crear una nueva cita médica
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Informacion del Paciente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Paciente *</Label>
                <Select value={formData.pacienteId} onValueChange={handlePatientChange} disabled={loadingCatalogs}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCatalogs ? "Cargando pacientes..." : "Seleccionar paciente"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {patients.map((paciente) => (
                      <SelectItem key={paciente.id} value={paciente.id.toString()}>
                        {paciente.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de Cita *</Label>
                <Select value={formData.tipo} onValueChange={(value) => handleFieldChange("tipo", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Consulta",
                      "Limpieza",
                      "Ortodoncia",
                      "Endodoncia",
                      "Exodoncia",
                      "Implante",
                      "Resinas",
                      "Cambio",
                      "Revision",
                      "Emergencia",
                    ].map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="descripcion">Descripcion</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => handleFieldChange("descripcion", e.target.value)}
                placeholder="Detalles adicionales de la cita..."
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building className="w-4 h-4" />
              Ubicacion
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Clinica *</Label>
                <Select value={formData.idClinica} onValueChange={handleClinicaChange} disabled={loadingCatalogs}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={loadingCatalogs ? "Cargando clinicas..." : "Seleccionar clinica"}
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {clinics.map((clinica) => (
                      <SelectItem key={clinica.id} value={clinica.id.toString()}>
                        {clinica.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clinics.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    No hay clinicas disponibles en tu tenant o estan inactivas. Contacta al administrador.
                  </p>
                )}
              </div>
              <div>
                <Label>Consultorio *</Label>
                <Select value={formData.idConsultorio} onValueChange={handleConsultorioChange} disabled={loadingCatalogs || consultoriosFiltrados.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCatalogs ? "Cargando consultorios..." : "Seleccionar consultorio"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {consultoriosFiltrados.map((consultorio) => (
                      <SelectItem key={consultorio.id} value={consultorio.id.toString()}>
                        {consultorio.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Fecha y Hora
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Fecha *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.fecha && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.fecha ? format(formData.fecha, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DatePicker
                      mode="single"
                      selected={formData.fecha}
                      onSelect={(date) => {
                        if (date) {
                          handleFieldChange("fecha", date);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Medico *</Label>
                <Select value={formData.idOdontologo} onValueChange={handleOdontologoChange} disabled={loadingDoctores}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingDoctores ? "Cargando medicos..." : "Seleccionar medico"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {doctores.map((doctor) => {
                      const nombreCompleto = buildNombreCompleto(doctor.nombres, doctor.apellidos) || `Odontologo ${doctor.id}`;
                      const color = obtenerColorParaOdontologo(nombreCompleto);
                      return (
                        <SelectItem key={doctor.id} value={doctor.id.toString()}>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", color)}></div>
                            {nombreCompleto}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hora de inicio *</Label>
                <Select value={formData.horaInicio} onValueChange={(value) => handleFieldChange("horaInicio", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {horasDisponibles.map((hora) => (
                      <SelectItem key={hora} value={hora}>
                        {hora}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hora de fin *</Label>
                <Select value={formData.horaFin} onValueChange={(value) => handleFieldChange("horaFin", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {horasDisponibles.map((hora) => (
                      <SelectItem key={hora} value={hora}>
                        {hora}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              <Stethoscope className="w-4 h-4 mr-2" />
              {isSubmitting ? "Creando..." : "Crear Cita"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewAppointmentModal;

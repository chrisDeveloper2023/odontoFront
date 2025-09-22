// src/components/NewAppointmentModal.tsx
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, User, Stethoscope } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getOdontologos } from "@/servicios/usuarios";

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: AppointmentData) => void;
}

interface AppointmentData {
  paciente: string;
  tipo: string;
  descripcion: string;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  odontologo: string;
  color: string;
}

const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  odontologos: odontologosProp
}) => {
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [loadingDoctores, setLoadingDoctores] = useState(false);

  // Cargar doctores desde el servicio
  useEffect(() => {
    const cargarDoctores = async () => {
      setLoadingDoctores(true);
      try {
        const doctoresData = await getOdontologos();
        setDoctores(doctoresData);
      } catch (error) {
        console.error("Error cargando doctores:", error);
        // Fallback a datos por defecto si falla la carga
        setDoctores([
          { id: 1, nombres: "Guadalupe", apellidos: "Guerrero" },
          { id: 2, nombres: "Pamela", apellidos: "Gil" },
          { id: 3, nombres: "Juan", apellidos: "Domingo" },
        ]);
      } finally {
        setLoadingDoctores(false);
      }
    };

    if (isOpen) {
      cargarDoctores();
    }
  }, [isOpen]);

  const odontologosPorDefecto = [
    { id: 1, nombre: "Guadalupe Guerrero", color: "bg-pink-500" },
    { id: 2, nombre: "Pamela Gil", color: "bg-yellow-500" },
    { id: 3, nombre: "Juan Domingo", color: "bg-red-500" },
  ];

  const odontologos = odontologosProp || odontologosPorDefecto;
  const [formData, setFormData] = useState<AppointmentData>({
    paciente: "",
    tipo: "",
    descripcion: "",
    fecha: new Date(),
    horaInicio: "09:00",
    horaFin: "10:00",
    odontologo: "",
    color: "bg-blue-500"
  });

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const tiposCita = [
    "Consulta",
    "Limpieza",
    "Ortodoncia",
    "Endodoncia",
    "Exodoncia",
    "Implante",
    "Resinas",
    "Cambio",
    "Revisin",
    "Emergencia"
  ];

interface Doctor {
  id: number;
  nombres: string;
  apellidos: string;
}

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: AppointmentData) => void;
  odontologos?: Array<{ id: number; nombre: string; color: string }>;
}

  const horasDisponibles = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
  ];

  const handleInputChange = (field: keyof AppointmentData, value: string | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOdontologoChange = (doctorId: string) => {
    const doctor = doctores.find(d => d.id.toString() === doctorId);
    if (doctor) {
      const nombreCompleto = `${doctor.nombres} ${doctor.apellidos}`;
      // Buscar el color correspondiente en los odontlogos configurados
      const odontologoConfig = odontologos.find(o => o.nombre === nombreCompleto);
      const color = odontologoConfig?.color || "bg-blue-500";
      
      setFormData(prev => ({ 
        ...prev, 
        odontologo: nombreCompleto,
        color: color
      }));
    }
  };

  const handleSave = () => {
    if (!formData.paciente || !formData.tipo || !formData.odontologo) {
      return;
    }

    onSave(formData);
    setFormData({
      paciente: "",
      tipo: "",
      descripcion: "",
      fecha: new Date(),
      horaInicio: "09:00",
      horaFin: "10:00",
      odontologo: "",
      color: "bg-blue-500"
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Nueva Cita
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informacin del Paciente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Informacin del Paciente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paciente">Nombre del Paciente *</Label>
                <Input
                  id="paciente"
                  value={formData.paciente}
                  onChange={(e) => handleInputChange("paciente", e.target.value)}
                  placeholder="Ej: Juan Prez"
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo de Cita *</Label>
                <Select value={formData.tipo} onValueChange={(value) => handleInputChange("tipo", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposCita.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="descripcion">Descripcin</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => handleInputChange("descripcion", e.target.value)}
                placeholder="Detalles adicionales de la cita..."
                rows={3}
              />
            </div>
          </div>

          {/* Informacin de la Cita */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Fecha y Hora
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Fecha *</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
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
                    <Calendar
                      mode="single"
                      selected={formData.fecha}
                      onSelect={(date) => {
                        if (date) {
                          handleInputChange("fecha", date);
                          setIsCalendarOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="odontologo">Mdico *</Label>
                <Select 
                  value={formData.odontologo ? doctores.find(d => `${d.nombres} ${d.apellidos}` === formData.odontologo)?.id.toString() : ""} 
                  onValueChange={handleOdontologoChange}
                  disabled={loadingDoctores}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingDoctores ? "Cargando mdicos..." : "Seleccionar mdico"} />
                  </SelectTrigger>
                  <SelectContent>
                    {doctores.map((doctor) => {
                      const nombreCompleto = `${doctor.nombres} ${doctor.apellidos}`;
                      const odontologoConfig = odontologos.find(o => o.nombre === nombreCompleto);
                      const color = odontologoConfig?.color || "bg-blue-500";
                      
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
                <Label htmlFor="horaInicio">Hora de Inicio *</Label>
                <Select value={formData.horaInicio} onValueChange={(value) => handleInputChange("horaInicio", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {horasDisponibles.map((hora) => (
                      <SelectItem key={hora} value={hora}>
                        {hora}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="horaFin">Hora de Fin *</Label>
                <Select value={formData.horaFin} onValueChange={(value) => handleInputChange("horaFin", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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

          {/* Botones */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!formData.paciente || !formData.tipo || !formData.odontologo}>
              <Stethoscope className="w-4 h-4 mr-2" />
              Crear Cita
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewAppointmentModal;

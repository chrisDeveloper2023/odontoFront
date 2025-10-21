// src/pages/Calendar.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CalendarPlus,
  Settings,
  Eye,
  ChevronLeft,
  ChevronRight,
  Bell,
  HelpCircle,
  User,
  CheckCircle,
  Clock,
  Trash2,
  Edit
} from "lucide-react";
import { cn } from "@/lib/utils";
import NewAppointmentModal, { NewAppointmentPayload } from "@/components/NewAppointmentModal";
import AppointmentEditModal from "@/components/AppointmentEditModal";
import { apiGet, apiPost, apiDelete } from "@/api/client";
import { toast } from "sonner";
import CalendarSettingsModal from "@/components/CalendarSettingModal";
import { getOdontologos } from "@/servicios/usuarios";
import {
  combineDateAndTimeGuayaquil,
  formatGuayaquilDate,
  formatGuayaquilDateISO,
  formatGuayaquilTime,
  formatGuayaquilTimeHM,
  parseDateInGuayaquil,
  toGuayaquilISOString,
} from "@/lib/timezone";

// --- Helpers de rango en America/Guayaquil (evitan desfases de -05:00) ---
const startOfDayGye = (d: Date) => {
  const isoDay = formatGuayaquilDateISO(d); // "YYYY-MM-DD" en GYE
  return parseDateInGuayaquil(isoDay)!;     // 00:00:00 -05:00 como Date
};
const addDaysGye = (d: Date, n: number) => new Date(startOfDayGye(d).getTime() + n * 86400000);
const inRangeGye = (dt: Date, start: Date, end: Date) => dt >= start && dt < end;
const getInicioSemanaGye = (base: Date) => {
  const d0 = startOfDayGye(base);
  const day = d0.getDay(); // 0=Dom, 1=Lun...
  const delta = day === 0 ? -6 : 1 - day;
  return addDaysGye(d0, delta);
};
const getFinSemanaGye = (base: Date) => addDaysGye(getInicioSemanaGye(base), 7);

// Colores por estado de la cita (tailwind)
const ESTADO_COLOR: Record<string, string> = {
  AGENDADA: "bg-green-500",
  CONFIRMADA: "bg-emerald-500",
  EN_CONSULTA: "bg-indigo-500",
  EN_PROCEDIMIENTO: "bg-blue-500",
  REALIZADA: "bg-gray-500",
  CANCELADA: "bg-red-500",
  NO_SHOW: "bg-orange-500",
};
const getEstadoColor = (estado?: string) => ESTADO_COLOR[estado ?? ""] ?? "bg-slate-400";

interface Cita {
  id: number;
  paciente: string;
  tipo: string;
  descripcion: string;
  horaInicio: string;
  horaFin: string;
  color: string;
  odontologo: string;
  estado?: string;
  icono?: string;
  fecha?: Date;
}

interface Doctor {
  id: number;
  nombres: string;
  apellidos: string;
}

interface Odontologo {
  id: number;
  nombre: string;
  color: string;
}

type BackendCita = {
  id_cita?: number;
  id?: number;
  fecha_hora: string;
  duracion_minutos?: number | null;
  estado?: string | null;
  observaciones?: string | null;
  paciente?: { nombres?: string | null; apellidos?: string | null } | null;
  odontologo?: { id?: number; nombres?: string | null; apellidos?: string | null } | null;
  consultorio?: { id_consultorio?: number; nombre?: string | null; id_clinica?: number | null } | null;
  id_paciente?: number | null;
  id_odontologo?: number | null;
  id_consultorio?: number | null;
  id_clinica?: number | null;
};

const DOCTOR_COLORS = [
  "bg-pink-500",
  "bg-yellow-500",
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
];

const buildNombreCompleto = (nombres?: string | null, apellidos?: string | null) => {
  return [nombres, apellidos].filter(Boolean).join(" ").trim();
};

const combinarFechaHora = (fecha: Date, hora: string) => {
  const iso = combineDateAndTimeGuayaquil(fecha, hora);
  if (iso) {
    const date = new Date(iso);
    if (!Number.isNaN(date.getTime())) return date;
  }
  const fallback = new Date(fecha);
  const [h, m] = hora.split(":").map((value) => parseInt(value, 10) || 0);
  fallback.setHours(h, m, 0, 0);
  return fallback;
};

const sumarMinutos = (fecha: Date, minutos: number) => {
  return new Date(fecha.getTime() + minutos * 60000);
};

const formatearHoraDesdeFecha = (fecha: Date) => {
  // Usar hora local directamente para evitar problemas de zona horaria
  const horas = fecha.getHours().toString().padStart(2, '0');
  const minutos = fecha.getMinutes().toString().padStart(2, '0');
  return `${horas}:${minutos}`;
};

// Formato para eje horario (12h con am/pm limpio)
const formatearHoraEje = (base: Date, hour: number) => {
  const d = new Date(base);
  d.setHours(hour, 0, 0, 0);
  return formatGuayaquilTime(d, { hour: "numeric", minute: "2-digit", hour12: true });
};

// Función helper para generar el contenido del tooltip
const generarContenidoTooltip = (cita: Cita) => {
  return (
    <div className="space-y-1 text-sm">
      <div className="font-semibold">{cita.paciente}</div>
      <div className="text-gray-300">
        <div><strong>Fecha:</strong> {formatGuayaquilDate(cita.fecha!, { dateStyle: 'long' })}</div>
        <div><strong>Hora:</strong> {cita.horaInicio} - {cita.horaFin}</div>
        <div><strong>Tipo:</strong> {cita.tipo}</div>
        {cita.descripcion && <div><strong>Descripción:</strong> {cita.descripcion}</div>}
        {cita.odontologo && <div><strong>Odontólogo:</strong> {cita.odontologo}</div>}
      </div>
    </div>
  );
};

const Calendar: React.FC = () => {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [vistaActual, setVistaActual] = useState<'dia' | 'semana' | 'mes'>('semana');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [citas, setCitas] = useState<Cita[]>([]);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [loadingDoctores, setLoadingDoctores] = useState(false);
  const [odontologos, setOdontologos] = useState<Odontologo[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [citasError, setCitasError] = useState<string | null>(null);
  const [creatingAppointment, setCreatingAppointment] = useState(false);
  const [odontologosListo, setOdontologosListo] = useState(false);
  const [isEditAppointmentOpen, setIsEditAppointmentOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  // Cargar médicos al montar el componente
  useEffect(() => {
    const cargarDoctores = async () => {
      setLoadingDoctores(true);
      try {
        const doctoresData = await getOdontologos();
        setDoctores(doctoresData);

        const odontologosIniciales = doctoresData.map((doctor, index) => {
          const color = DOCTOR_COLORS[index % DOCTOR_COLORS.length];
          return {
            id: doctor.id,
            nombre: buildNombreCompleto(doctor.nombres, doctor.apellidos),
            color,
          };
        });
        setOdontologos(odontologosIniciales);
        setOdontologosListo(true);
      } catch (error) {
        console.error("Error cargando medicos:", error);
        const doctoresFallback = [
          { id: 1, nombres: "Guadalupe", apellidos: "Guerrero" },
          { id: 2, nombres: "Pamela", apellidos: "Gil" },
          { id: 3, nombres: "Juan", apellidos: "Domingo" },
        ];
        setDoctores(doctoresFallback);
        setOdontologos([
          { id: 1, nombre: "Guadalupe Guerrero", color: "bg-pink-500" },
          { id: 2, nombre: "Pamela Gil", color: "bg-yellow-500" },
          { id: 3, nombre: "Juan Domingo", color: "bg-red-500" },
        ]);
        setOdontologosListo(true);
        toast.error("No se pudieron cargar los medicos");
      } finally {
        setLoadingDoctores(false);
      }
    };

    cargarDoctores();
  }, []);

    const obtenerRangoFechas = useCallback(() => {
    const inicio = new Date(fechaActual);
    const fin = new Date(fechaActual);

    if (vistaActual === "dia") {
      inicio.setHours(0, 0, 0, 0);
      fin.setHours(23, 59, 59, 999);
      return { inicio, fin };
    }

    if (vistaActual === "semana") {
      const dia = inicio.getDay();
      const diff = inicio.getDate() - dia + (dia === 0 ? -6 : 1);
      inicio.setDate(diff);
      inicio.setHours(0, 0, 0, 0);
      fin.setDate(diff + 6);
      fin.setHours(23, 59, 59, 999);
      return { inicio, fin };
    }

    // vista mes
    inicio.setDate(1);
    inicio.setHours(0, 0, 0, 0);
    fin.setMonth(inicio.getMonth() + 1, 0);
    fin.setHours(23, 59, 59, 999);
    return { inicio, fin };
  }, [fechaActual, vistaActual]);

  const fetchCitas = useCallback(async () => {
    if (!odontologosListo) {
      return;
    }
    const { inicio, fin } = obtenerRangoFechas();
    setLoadingCitas(true);
    setCitasError(null);
    try {
      const response = await apiGet<any>("/citas", {
        page: 1,
        limit: 500,
        desde: toGuayaquilISOString(inicio),
        hasta: toGuayaquilISOString(fin),
      });

      const lista = Array.isArray(response?.data)
        ? response.data
        : (Array.isArray(response) ? response : []);

      const normalizadas: Cita[] = lista
        .map((raw: BackendCita) => {
          if (!raw?.fecha_hora) return null;
          const inicioCita = parseDateInGuayaquil(raw.fecha_hora);
          if (!inicioCita) return null;
          const duracion = raw.duracion_minutos && raw.duracion_minutos > 0 ? raw.duracion_minutos : 60;
          const finCita = sumarMinutos(inicioCita, duracion);

          const nombrePaciente = buildNombreCompleto(raw.paciente?.nombres, raw.paciente?.apellidos) || "Paciente";
          const nombreOdontologo = buildNombreCompleto(raw.odontologo?.nombres, raw.odontologo?.apellidos) || "Sin asignar";
          const estado = (raw.estado || "AGENDADA").toUpperCase();
          const colorConfig = odontologos.find((o) => o.nombre === nombreOdontologo)?.color;
          const colorEstado = getEstadoColor(estado);

          return {
            id: raw.id_cita ?? raw.id ?? Number(inicioCita.getTime()),
            paciente: nombrePaciente,
            tipo: estado,
            descripcion: raw.observaciones || "",
            horaInicio: formatearHoraDesdeFecha(inicioCita),
            horaFin: formatearHoraDesdeFecha(finCita),
            color: colorConfig || colorEstado,
            odontologo: nombreOdontologo,
            icono: "",
            fecha: inicioCita, // Date ya parseado en zona Guayaquil
            estado,
          } as Cita;
        })
        .filter((item): item is Cita => Boolean(item));

      setCitas(normalizadas);
    } catch (error: any) {
      console.error("Error cargando citas:", error);
      setCitasError(error?.message || "No se pudieron cargar las citas");
    } finally {
      setLoadingCitas(false);
    }
  }, [obtenerRangoFechas, odontologos, odontologosListo]);

  useEffect(() => {
    if (!odontologosListo) return;
    fetchCitas();
  }, [fetchCitas, odontologosListo]);
  const inicioSemana = useMemo(() => getInicioSemanaGye(fechaActual), [fechaActual]);
  const finSemana = useMemo(() => getFinSemanaGye(fechaActual), [fechaActual]);
  const diasSemana = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => addDaysGye(inicioSemana, i)),
    [inicioSemana]
  );

  const citasDia = useMemo(() => {
    const ini = startOfDayGye(fechaSeleccionada);
    const fin = addDaysGye(fechaSeleccionada, 1);
    return citas.filter((cita) => cita?.fecha && inRangeGye(cita.fecha, ini, fin));
  }, [citas, fechaSeleccionada]);

  const citasSemana = useMemo(() => {
    return citas.filter((cita) => cita?.fecha && inRangeGye(cita.fecha, inicioSemana, finSemana));
  }, [citas, inicioSemana, finSemana]);

  const obtenerDiasMes = () => {
    const ao = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();
    
    // Primer da del mes
    const primerDia = new Date(ao, mes, 1);
    // ltimo da del mes
    const ultimoDia = new Date(ao, mes + 1, 0);
    
    // Da de la semana del primer da (0 = domingo, 1 = lunes, etc.)
    const diaSemanaInicio = primerDia.getDay();
    // Ajustar para que lunes sea 0
    const diaSemanaInicioAjustado = (diaSemanaInicio + 6) % 7;
    
    // Das del mes anterior para completar la primera semana
    const diasAnteriores = [];
    const mesAnterior = new Date(ao, mes - 1, 0);
    for (let i = diaSemanaInicioAjustado - 1; i >= 0; i--) {
      const fecha = new Date(mesAnterior);
      fecha.setDate(mesAnterior.getDate() - i);
      diasAnteriores.push(fecha);
    }
    
    // Das del mes actual
    const diasActuales = [];
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      diasActuales.push(new Date(ao, mes, dia));
    }
    
    // Das del mes siguiente para completar la ltima semana
    const diasSiguientes = [];
    const totalCeldas = diasAnteriores.length + diasActuales.length;
    const celdasRestantes = 42 - totalCeldas; // 6 semanas * 7 das = 42 celdas
    for (let dia = 1; dia <= celdasRestantes; dia++) {
      diasSiguientes.push(new Date(ao, mes + 1, dia));
    }
    
    return [...diasAnteriores, ...diasActuales, ...diasSiguientes];
  };

  const obtenerHoraActual = () => {
    const hm = formatGuayaquilTimeHM(new Date());
    if (hm) {
      const [hStr, mStr] = hm.split(":");
      const horas = Number(hStr) || 0;
      const minutos = Number(mStr) || 0;
      return horas + minutos / 60;
    }
    const fallback = new Date();
    return fallback.getHours() + fallback.getMinutes() / 60;
  };

  const obtenerCitasDelDia = (fecha: Date, fuente: Cita[] = citas) => {
    const ini = startOfDayGye(fecha);
    const fin = addDaysGye(fecha, 1);
    return fuente.filter((cita) => {
      if (!cita?.fecha) return false;
      return inRangeGye(cita.fecha, ini, fin);
    });
  };

  const esHoy = (fecha: Date) => {
    const hoy = formatGuayaquilDateISO(new Date());
    const comparar = formatGuayaquilDateISO(fecha);
    return Boolean(hoy) && comparar === hoy;
  };

  const esDelMesActual = (fecha: Date) => {
    return fecha.getMonth() === fechaActual.getMonth() &&
           fecha.getFullYear() === fechaActual.getFullYear();
  };

  const navegarMes = (direccion: 'anterior' | 'siguiente') => {
    const nuevaFecha = new Date(fechaActual);
    if (direccion === 'anterior') {
      nuevaFecha.setMonth(nuevaFecha.getMonth() - 1);
    } else {
      nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
    }
    setFechaActual(nuevaFecha);
  };

  const irAHoy = () => {
    const hoy = new Date();
    setFechaActual(hoy);
    setFechaSeleccionada(hoy);
  };

  const obtenerPosicionEvento = (horaInicio: string) => {
    const [h, m] = horaInicio.split(':');
    const horaDecimal = parseInt(h) + (parseInt(m) / 60);
    // Las líneas están en i * 60, donde i = hora - 10
    const indiceHora = horaDecimal - 10;
    return indiceHora * 60;
  };

  const obtenerAlturaEvento = (horaInicio: string, horaFin: string) => {
    const [h1, m1] = horaInicio.split(':');
    const [h2, m2] = horaFin.split(':');
    const inicio = parseInt(h1) + (parseInt(m1) / 60);
    const fin = parseInt(h2) + (parseInt(m2) / 60);
    return (fin - inicio) * 60; // cada hora = 60px
  };

  const cambiarVista = (vista: 'dia' | 'semana' | 'mes') => {
    setVistaActual(vista);
    if (vista === 'dia') {
      setFechaSeleccionada(fechaActual);
    }
  };

  const formatearHora = (hora: string) => {
    const [h, m] = hora.split(':');
    return `${h}:${m}`;
  };

  const obtenerPosicionCita = (horaInicio: string) => {
    const [h, m] = horaInicio.split(':');
    const horaDecimal = parseInt(h) + (parseInt(m) / 60);
    // Las líneas están en (i * 60) + 20, donde i = hora - 10
    const indiceHora = horaDecimal - 10;
    return (indiceHora * 60) + 20;
  };

  const obtenerAlturaCita = (horaInicio: string, horaFin: string) => {
    const [h1, m1] = horaInicio.split(':');
    const [h2, m2] = horaFin.split(':');
    const inicio = parseInt(h1) + (parseInt(m1) / 60);
    const fin = parseInt(h2) + (parseInt(m2) / 60);
    return (fin - inicio) * 60; // cada hora = 60px
  };

  const horaActual = obtenerHoraActual();

  const handleNewAppointment = async (appointment: NewAppointmentPayload) => {
    try {
      setCreatingAppointment(true);
      const inicioIso = combineDateAndTimeGuayaquil(appointment.fecha, appointment.horaInicio);
      const finIso = combineDateAndTimeGuayaquil(appointment.fecha, appointment.horaFin);
      const inicio = inicioIso ? new Date(inicioIso) : combinarFechaHora(appointment.fecha, appointment.horaInicio);
      const fin = finIso ? new Date(finIso) : combinarFechaHora(appointment.fecha, appointment.horaFin);
      const duracion = Math.max(15, Math.round((fin.getTime() - inicio.getTime()) / 60000));

      const payload = {
        id_paciente: appointment.idPaciente,
        id_odontologo: appointment.idOdontologo,
        id_consultorio: appointment.idConsultorio,
        id_clinica: appointment.idClinica,
        fecha_hora: inicioIso || toGuayaquilISOString(inicio),
        duracion_minutos: duracion,
        observaciones: appointment.descripcion || null,
        estado: "AGENDADA",
      };

      await apiPost("/citas", payload);
      toast.success("Cita creada correctamente");
      await fetchCitas();
      setIsNewAppointmentOpen(false);
    } catch (error: any) {
      console.error("Error creando cita:", error);
      toast.error(error?.message || "No se pudo crear la cita");
      throw error;
    } finally {
      setCreatingAppointment(false);
    }
  };

  const handleSaveSettings = (nuevosOdontologos: Odontologo[]) => {
    setOdontologos(nuevosOdontologos);
    
    // Actualizar colores de las citas existentes
    setCitas(prev => prev.map(cita => {
      const odontologo = nuevosOdontologos.find(o => o.nombre === cita.odontologo);
      return odontologo ? { ...cita, color: odontologo.color } : cita;
    }));
  };

  const handleDeleteAppointment = async (cita: Cita) => {
    const confirmMessage = `¿Estás seguro de que quieres eliminar la cita de ${cita.paciente}?\n\nFecha: ${formatGuayaquilDate(cita.fecha!, { dateStyle: 'long' })}\nHora: ${cita.horaInicio} - ${cita.horaFin}`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await apiDelete(`/citas/${cita.id}`);
      toast.success("Cita eliminada correctamente");
      await fetchCitas();
    } catch (error: any) {
      console.error("Error eliminando cita:", error);
      toast.error(error?.message || "No se pudo eliminar la cita");
    }
  };

  const handleEditAppointment = (cita: Cita) => {
    setSelectedAppointmentId(String(cita.id));
    setIsEditAppointmentOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditAppointmentOpen(false);
    setSelectedAppointmentId(null);
  };

  const handleAppointmentUpdated = () => {
    fetchCitas(); // Refrescar las citas después de la edición
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen">
        {/* Sidebar Izquierdo */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Calendario</h1>
          
          {/* Botones de Accin */}
          <div className="space-y-3 mb-8">
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setIsNewAppointmentOpen(true)}
            >
              <CalendarPlus className="w-4 h-4 mr-2" />
              Nuevo evento
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configuracin
            </Button>
            <Button variant="outline" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              Ver todos
            </Button>
          </div>

          {/* Leyenda de Mdicos */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mdicos</h3>
            {loadingDoctores ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Cargando mdicos...
              </div>
            ) : odontologos.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No hay mdicos disponibles
              </div>
            ) : (
              odontologos.map((odontologo) => (
                <div key={odontologo.id} className="flex items-center space-x-3">
                  <div className={cn("w-3 h-3 rounded-full", odontologo.color)}></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{odontologo.nombre}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 flex flex-col">
          {/* Header del Calendario */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              {/* Selector de Vista */}
              <div className="flex space-x-2">
                <Button
                  variant={vistaActual === 'dia' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => cambiarVista('dia')}
                >
                  Día
                </Button>
                <Button
                  variant={vistaActual === 'semana' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => cambiarVista('semana')}
                >
                  Semana
                </Button>
                <Button
                  variant={vistaActual === 'mes' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => cambiarVista('mes')}
                >
                  Mes
                </Button>
              </div>

              {/* Navegacin de Fechas */}
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    if (vistaActual === 'mes') {
                      navegarMes('anterior');
                    } else if (vistaActual === 'dia') {
                      const nuevaFecha = new Date(fechaSeleccionada);
                      nuevaFecha.setDate(nuevaFecha.getDate() - 1);
                      setFechaSeleccionada(nuevaFecha);
                      setFechaActual(nuevaFecha);
                    } else {
                      setFechaActual(new Date(fechaActual.getTime() - 7 * 24 * 60 * 60 * 1000));
                    }
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                {/* Selector de da para vista diaria */}
                {vistaActual === 'dia' ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      type="date"
                      value={formatGuayaquilDateISO(fechaSeleccionada)}
                      onChange={(e) => {
                        const parseada = parseDateInGuayaquil(e.target.value);
                        if (parseada) {
                          setFechaSeleccionada(parseada);
                          setFechaActual(parseada);
                        }
                      }}
                      className="w-40"
                    />
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatGuayaquilDate(fechaSeleccionada, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {vistaActual === 'mes' 
                        ? formatGuayaquilDate(fechaActual, { year: 'numeric', month: '2-digit' })
                        : formatGuayaquilDate(fechaActual, { year: 'numeric', month: '2-digit', day: '2-digit' })
                      }
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatGuayaquilTime(new Date(), { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    if (vistaActual === 'mes') {
                      navegarMes('siguiente');
                    } else if (vistaActual === 'dia') {
                      const nuevaFecha = new Date(fechaSeleccionada);
                      nuevaFecha.setDate(nuevaFecha.getDate() + 1);
                      setFechaSeleccionada(nuevaFecha);
                      setFechaActual(nuevaFecha);
                    } else {
                      setFechaActual(new Date(fechaActual.getTime() + 7 * 24 * 60 * 60 * 1000));
                    }
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={irAHoy}
                >
                  Hoy
                </Button>
              </div>

              {/* Iconos de Accin */}
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Bell className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <HelpCircle className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <User className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Calendario */}
          <div className="flex-1 overflow-auto">
            <div className="h-full">
              {vistaActual === 'dia' ? (
                // Vista Diaria
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm h-full">
                  <div className="flex h-full">
                    {/* Columna de Horas */}
                    <div className="w-20 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600">
                      {Array.from({ length: 14 }, (_, i) => {
                        const hora = 10 + i;
                        const esHoraActual = esHoy(fechaSeleccionada) && hora === Math.floor(obtenerHoraActual());
                        return (
                          <div key={i} className="h-15 border-b border-gray-200 dark:border-gray-600 p-2 relative" style={{ height: '60px' }}>
                            <div className={cn(
                              "text-xs text-gray-500 dark:text-gray-400",
                              esHoraActual && "text-blue-600 font-semibold"
                            )}>
                              {formatearHoraEje(fechaSeleccionada, hora)}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* rea de Eventos */}
                    <div className="flex-1 relative bg-blue-50 dark:bg-blue-900/20">
                      {/* Lneas de Tiempo */}
                      {Array.from({ length: 14 }, (_, i) => (
                        <div 
                          key={i} 
                          className="absolute left-0 right-0 border-t border-gray-200 dark:border-gray-600"
                          style={{ top: `${i * 60}px` }}
                        />
                      ))}

                      {/* Lnea de Tiempo Actual */}
                      {esHoy(fechaSeleccionada) && (
                        <div 
                          className="absolute left-0 right-0 z-10 border-t-2 border-dashed border-blue-500"
                          style={{ top: `${(obtenerHoraActual() - 10) * 60}px` }}
                        >
                          <div className="absolute -left-2 -top-2 w-4 h-4 bg-blue-500 rounded-full"></div>
                          <div className="absolute -left-16 top-1 text-xs text-blue-600 font-semibold">
                            {formatGuayaquilTime(new Date(), { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      )}

                      {/* Eventos del Dia */}
                      {loadingCitas && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="px-3 py-1 text-sm text-blue-600 bg-blue-100 rounded">Cargando citas...</span>
                        </div>
                      )}
                      {citasError && !loadingCitas && (
                        <div className="absolute inset-x-0 top-2 flex justify-center pointer-events-none">
                          <span className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded">{citasError}</span>
                        </div>
                      )}
                      {citasDia.map((cita) => {
                        const posicion = obtenerPosicionEvento(cita.horaInicio);
                        const altura = obtenerAlturaEvento(cita.horaInicio, cita.horaFin);

                        return (
                          <Tooltip key={cita.id}>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "absolute left-2 right-2 rounded-md p-3 text-white text-sm hover:opacity-80 transition-opacity shadow-md group cursor-pointer",
                                  cita.color
                                )}
                                style={{
                                  top: `${posicion}px`,
                                  height: `${altura}px`,
                                }}
                              >
                                <div className="flex flex-col justify-center items-center h-full text-center">
                                  <div className="flex items-center justify-between w-full mb-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-semibold text-lg">{cita.icono} {cita.paciente}</span>
                                      <span className="text-lg font-medium text-sm"> {cita.descripcion} : {cita.tipo}
                                      - {formatearHora(cita.horaInicio)} - {formatearHora(cita.horaFin)}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 bg-white/20 hover:bg-white/30 border-white/30"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditAppointment(cita);
                                        }}
                                      >
                                        <Edit className="h-3 w-3 text-white" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteAppointment(cita);
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="font-bold text-base mb-1">
                                  </div>
                                  <div className="text-sm opacity-90"></div>
                                  <div className="text-xs opacity-75 mt-1">
                                    
                                  </div>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              {generarContenidoTooltip(cita)}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}

                      {/* Mensaje si no hay eventos */}
                      {!loadingCitas && citasDia.length === 0 && (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center text-gray-500 dark:text-gray-400">
                            <div className="text-lg font-medium mb-2">No hay eventos programados</div>
                            <div className="text-sm">para {formatGuayaquilDate(fechaSeleccionada, { dateStyle: 'long' })}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : vistaActual === 'mes' ? (
                // Vista Mensual
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  {/* Header de Das de la Semana */}
                  <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((dia, index) => (
                      <div key={index} className="p-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600 last:border-r-0">
                        {dia}
                      </div>
                    ))}
                  </div>

                  {/* Grid del Mes */}
                  <div className="grid grid-cols-7">
                    {obtenerDiasMes().map((dia, index) => {
                      const citasDelDia = obtenerCitasDelDia(dia);
                      const esHoyDia = esHoy(dia);
                      const esDelMes = esDelMesActual(dia);
                      
                      return (
                        <div
                          key={index}
                          className={cn(
                            "min-h-[120px] p-2 border-r border-b border-gray-200 dark:border-gray-600 last:border-r-0",
                            !esDelMes && "bg-gray-50 dark:bg-gray-900 text-gray-400",
                            esHoyDia && "bg-blue-50 dark:bg-blue-900/20"
                          )}
                        >
                          {/* Nmero del da */}
                          <div className={cn(
                            "text-sm font-medium mb-1",
                            esHoyDia && "bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center",
                            !esDelMes && "text-gray-400"
                          )}>
                            {dia.getDate()}
                          </div>

                          {/* Citas del da */}
                          <div className="space-y-1">
                            {citasDelDia.slice(0, 3).map((cita) => (
                              <Tooltip key={cita.id}>
                                <TooltipTrigger asChild>
                                  <div
                                    className={cn(
                                      "text-xs p-1 rounded hover:opacity-80 transition-opacity group cursor-pointer",
                                      cita.color,
                                      "text-white"
                                    )}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-1">
                                        <span className="text-xs">{cita.icono}</span>
                                        <span className="font-medium truncate">{formatearHora(cita.horaInicio)}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="opacity-70 hover:opacity-100 transition-opacity h-6 w-6 p-0 bg-white/40 hover:bg-white/50 border-white/50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditAppointment(cita);
                                          }}
                                        >
                                          <Edit className="h-4 w-4 text-white" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          className="opacity-70 hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteAppointment(cita);
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="truncate font-medium">{cita.paciente}</div>
                                    <div className="truncate opacity-90">{cita.descripcion}</div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  {generarContenidoTooltip(cita)}
                                </TooltipContent>
                              </Tooltip>
                            ))}
                            {citasDelDia.length > 3 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                +{citasDelDia.length - 3} ms
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // Vista Semanal (cdigo existente)
                <>
                  {/* Header de Das */}
                  <div className="grid grid-cols-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                      Hora
                    </div>
                    {diasSemana.map((dia, index) => (
                      <div key={index} className="p-3 text-center border-l border-gray-200 dark:border-gray-700">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {dia.getDate()} {formatGuayaquilDate(dia, { weekday: 'short' }).toUpperCase()}
                        </div>
                        <div className={cn(
                          "text-xs mt-1",
                          dia.getDay() === 0 ? "text-red-500" : "text-gray-500 dark:text-gray-400"
                        )}>
                          {formatGuayaquilDate(dia, { month: 'short' })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Grid del Calendario */}
                  <div className="relative">
                    {/* Lnea de Tiempo Actual */}
                    {horaActual >= 10 && horaActual <= 20 && (
                      <div 
                        className="absolute left-0 right-0 z-10 border-t-2 border-dashed border-blue-500"
                        style={{ top: `${((horaActual - 10) * 60) + 20}px` }}
                      >
                        <div className="absolute -left-2 -top-2 w-4 h-4 bg-blue-500 rounded-full"></div>
                      </div>
                    )}

                    {/* Slots de Tiempo */}
                    <div className="grid grid-cols-8">
                      {/* Columna de Horas */}
                      <div className="bg-gray-50 dark:bg-gray-700">
                        {Array.from({ length: 11 }, (_, i) => {
                          const hora = 10 + i;
                          return (
                            <div key={i} className="h-15 border-b border-gray-200 dark:border-gray-600 p-2">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {hora}:00 {hora < 12 ? 'am' : 'pm'}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Columnas de Das */}
                      {diasSemana.map((dia, diaIndex) => (
                        <div key={diaIndex} className="relative border-l border-gray-200 dark:border-gray-700">
                          {Array.from({ length: 11 }, (_, i) => (
                            <div key={i} className="h-15 border-b border-gray-200 dark:border-gray-600"></div>
                          ))}

                          {/* Citas del Da */}
                          {(() => {
                            const ini = startOfDayGye(dia);
                            const fin = addDaysGye(dia, 1);
                            const delDia = citasSemana.filter((cita) => cita?.fecha && inRangeGye(cita.fecha, ini, fin));

                            return delDia.map((cita) => {
                              const posicion = obtenerPosicionCita(cita.horaInicio);
                              const altura = obtenerAlturaCita(cita.horaInicio, cita.horaFin);

                              return (
                                <Tooltip key={cita.id}>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={cn(
                                        "absolute left-1 right-1 rounded-md p-2 text-white text-xs hover:opacity-80 transition-opacity group relative cursor-pointer",
                                        cita.color
                                      )}
                                      style={{
                                        top: `${posicion}px`,
                                        height: `${altura}px`,
                                      }}
                                    >
                                      {/* Iconos en la parte superior derecha */}
                                      <div className="flex items-center space-x-1 absolute top-1 right-1">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="opacity-70 hover:opacity-100 transition-opacity h-4 w-4 p-0 bg-white/40 hover:bg-white/50 border-white/50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditAppointment(cita);
                                          }}
                                        >
                                          <Edit className="h-2 w-2 text-white" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          className="opacity-70 hover:opacity-100 transition-opacity h-4 w-4 p-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteAppointment(cita);
                                          }}
                                        >
                                          <Trash2 className="h-2 w-2" />
                                        </Button>
                                      </div>
                                      
                                      {/* Nombre del paciente abajo */}
                                      <div className="truncate font-medium absolute bottom-1 left-1">{cita.paciente}</div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    {generarContenidoTooltip(cita)}
                                  </TooltipContent>
                                </Tooltip>
                              );
                            });
                          })()}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Nueva Cita */}
      <NewAppointmentModal
        isOpen={isNewAppointmentOpen}
        onClose={() => setIsNewAppointmentOpen(false)}
        onSave={handleNewAppointment}
        odontologos={odontologos}
        isSubmitting={creatingAppointment}
      />

      {/* Modal de Configuracin */}
      <CalendarSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        odontologos={odontologos}
        onSave={handleSaveSettings}
      />

      {/* Modal de Edición de Cita */}
      <AppointmentEditModal
        appointmentId={selectedAppointmentId}
        isOpen={isEditAppointmentOpen}
        onClose={handleCloseEditModal}
        onAppointmentUpdated={handleAppointmentUpdated}
      />
      </div>
    </TooltipProvider>
  );
};

export default Calendar;




// src/pages/Calendar.tsx
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CalendarPlus,
  Settings,
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
import PatientSearchModal from "@/components/PatientSearchModal";
import { apiGet, apiPost, apiPut, apiDelete } from "@/api/client";
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
  pacienteId?: number;
  tipo: string;
  descripcion: string;
  horaInicio: string;
  horaFin: string;
  color: string;
  odontologo: string;
  odontologoId?: number;
  estado?: string;
  icono?: string;
  fecha?: Date;
  tenantId?: number | null;
  consultorio?: string;
  consultorioId?: number;
  clinica?: string;
  clinicaId?: number;
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

interface Consultorio {
  id: number;
  nombre: string;
  id_clinica?: number;
}

interface Clinica {
  id: number;
  nombre: string;
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
  tenantId?: number | null;
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
  const [isPatientSearchOpen, setIsPatientSearchOpen] = useState(false);
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [loadingDoctores, setLoadingDoctores] = useState(false);
  const [odontologos, setOdontologos] = useState<Odontologo[]>([]);
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [citasError, setCitasError] = useState<string | null>(null);
  const [creatingAppointment, setCreatingAppointment] = useState(false);
  const [odontologosListo, setOdontologosListo] = useState(false);
  const [isEditAppointmentOpen, setIsEditAppointmentOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [initialAppointmentData, setInitialAppointmentData] = useState<{
    fecha?: Date;
    horaInicio?: string;
    horaFin?: string;
    idPaciente?: number;
    idConsultorio?: number;
    idOdontologo?: number;
  } | null>(null);
  
  // Estado para filtro de clínica
  const [clinicaFiltro, setClinicaFiltro] = useState<string | null>(null);
  
  // Estado para filtro de odontólogo
  const [odontologoFiltro, setOdontologoFiltro] = useState<string | null>(null);
  
  // Estado para filtro de consultorio
  const [consultorioFiltro, setConsultorioFiltro] = useState<string | null>(null);
  
  // Estado para paciente seleccionado
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<{id: number, nombres: string, apellidos: string} | null>(null);
  
  // Estados temporales para fecha y hora al hacer doble clic
  const [tempFechaHora, setTempFechaHora] = useState<{fecha?: Date, hora?: string} | null>(null);
  
  // Estados para drag and drop
  const [draggedCita, setDraggedCita] = useState<Cita | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{fecha: Date, hora: string} | null>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  // Función para filtrar citas por clínica, odontólogo y consultorio
  const citasFiltradas = useMemo(() => {
    let resultado = citas;
    
    // Filtrar por clínica
    if (clinicaFiltro) {
      const clinicaSeleccionada = clinicas.find(c => c.id.toString() === clinicaFiltro);
      if (clinicaSeleccionada) {
        resultado = resultado.filter(cita => cita.clinica === clinicaSeleccionada.nombre);
      }
    }
    
    // Filtrar por odontólogo
    if (odontologoFiltro) {
      const odontologoSeleccionado = odontologos.find(od => od.id.toString() === odontologoFiltro);
      if (odontologoSeleccionado) {
        resultado = resultado.filter(cita => cita.odontologo === odontologoSeleccionado.nombre);
      }
    }
    
    // Filtrar por consultorio
    if (consultorioFiltro) {
      const consultorioSeleccionado = consultorios.find(c => c.id.toString() === consultorioFiltro);
      if (consultorioSeleccionado) {
        resultado = resultado.filter(cita => cita.consultorio === consultorioSeleccionado.nombre);
      }
    }
    
    return resultado;
  }, [citas, clinicaFiltro, clinicas, odontologoFiltro, odontologos, consultorioFiltro, consultorios]);

  // Obtener la clínica seleccionada basada en el consultorio filtrado
  const clinicaSeleccionada = useMemo(() => {
    if (!consultorioFiltro) return null;
    const consultorio = consultorios.find(c => c.id.toString() === consultorioFiltro);
    if (!consultorio || !consultorio.id_clinica) return null;
    return clinicas.find(c => c.id === consultorio.id_clinica) || null;
  }, [consultorioFiltro, consultorios, clinicas]);

  // Función para calcular la hora de fin (hora inicio + 30 minutos)
  const calcularHoraFin = (horaInicio: string): string => {
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const totalMinutos = horas * 60 + minutos + 30;
    
    const nuevasHoras = Math.floor(totalMinutos / 60);
    const nuevosMinutos = totalMinutos % 60;
    
    const horasFormateadas = nuevasHoras.toString().padStart(2, '0');
    const minutosFormateados = nuevosMinutos.toString().padStart(2, '0');
    
    return `${horasFormateadas}:${minutosFormateados}`;
  };

  // Cargar médicos y consultorios al montar el componente
  useEffect(() => {
    const cargarDoctores = async () => {
      setLoadingDoctores(true);
      try {
        const [doctoresData, consultoriosData, clinicasData] = await Promise.all([
          getOdontologos(),
          apiGet<any>("/consultorios"),
          apiGet<any>("/clinicas")
        ]);
        
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
        
        // Cargar consultorios
        const consultoriosArray = Array.isArray(consultoriosData) 
          ? consultoriosData 
          : Array.isArray(consultoriosData?.data) 
            ? consultoriosData.data 
            : [];
        const consultoriosMapeados = consultoriosArray.map((c: any) => ({
          id: c.id_consultorio ?? c.id ?? 0,
          nombre: c.nombre ?? `Consultorio ${c.id ?? ""}`,
          id_clinica: c.id_clinica ?? null,
        })).filter((c: Consultorio) => Number.isFinite(c.id));
        setConsultorios(consultoriosMapeados);
        
        // Cargar clínicas
        const clinicasArray = Array.isArray(clinicasData)
          ? clinicasData
          : Array.isArray(clinicasData?.data)
            ? clinicasData.data
            : [];
        const clinicasMapeadas = clinicasArray.map((c: any) => ({
          id: c.id ?? c.id_clinica ?? 0,
          nombre: c.nombre ?? c.nombre_clinica ?? c.alias ?? `Clinica ${c.id ?? ""}`,
        })).filter((c: Clinica) => Number.isFinite(c.id));
        setClinicas(clinicasMapeadas);
        
        setOdontologosListo(true);
      } catch (error) {
        console.error("Error cargando medicos:", error);
        setDoctores([]);
        setOdontologos([]);
        setConsultorios([]);
        setClinicas([]);
        setOdontologosListo(true);
        toast.error("No se pudieron cargar los medicos y consultorios");
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
          const nombreConsultorio = raw.consultorio?.nombre || "Sin asignar";
          const clinicaDeCita = clinicas.find(c => c.id === raw.id_clinica);
          const nombreClinica = clinicaDeCita?.nombre || "Sin asignar";
          const estado = (raw.estado || "AGENDADA").toUpperCase();
          const colorConfig = odontologos.find((o) => o.nombre === nombreOdontologo)?.color;
          const colorEstado = getEstadoColor(estado);

          return {
            id: raw.id_cita ?? raw.id ?? Number(inicioCita.getTime()),
            paciente: nombrePaciente,
            pacienteId: raw.id_paciente,
            tipo: estado,
            descripcion: raw.observaciones || "",
            horaInicio: formatearHoraDesdeFecha(inicioCita),
            horaFin: formatearHoraDesdeFecha(finCita),
            color: colorConfig || colorEstado,
            odontologo: nombreOdontologo,
            odontologoId: raw.id_odontologo,
            consultorio: nombreConsultorio,
            consultorioId: raw.id_consultorio,
            clinica: nombreClinica,
            clinicaId: raw.id_clinica,
            icono: "",
            fecha: inicioCita,
            estado,
            tenantId: raw.tenantId,
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
  }, [obtenerRangoFechas, odontologos, odontologosListo, clinicas]);

  useEffect(() => {
    if (!odontologosListo) return;
    fetchCitas();
  }, [fetchCitas, odontologosListo]);

  // Auto-seleccionar clínica si solo hay una disponible
  useEffect(() => {
    if (clinicas.length === 1 && !clinicaFiltro) {
      setClinicaFiltro(clinicas[0].id.toString());
    }
  }, [clinicas, clinicaFiltro]);

  const inicioSemana = useMemo(() => getInicioSemanaGye(fechaActual), [fechaActual]);
  const finSemana = useMemo(() => getFinSemanaGye(fechaActual), [fechaActual]);
  const diasSemana = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => addDaysGye(inicioSemana, i)),
    [inicioSemana]
  );

  const citasDia = useMemo(() => {
    const ini = startOfDayGye(fechaSeleccionada);
    const fin = addDaysGye(fechaSeleccionada, 1);
    return citasFiltradas.filter((cita) => cita?.fecha && inRangeGye(cita.fecha, ini, fin));
  }, [citasFiltradas, fechaSeleccionada]);

  const citasSemana = useMemo(() => {
    return citasFiltradas.filter((cita) => cita?.fecha && inRangeGye(cita.fecha, inicioSemana, finSemana));
  }, [citasFiltradas, inicioSemana, finSemana]);

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

  const obtenerCitasDelDia = (fecha: Date, fuente: Cita[] = citasFiltradas) => {
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

  // Funciones para drag and drop
  const handleDragStart = (e: React.DragEvent, cita: Cita) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cita.id.toString());
    
    const citaCompleta = {
      id: cita.id,
      paciente: cita.paciente,
      pacienteId: cita.pacienteId,
      tipo: cita.tipo,
      descripcion: cita.descripcion,
      horaInicio: cita.horaInicio,
      horaFin: cita.horaFin,
      color: cita.color,
      odontologo: cita.odontologo,
      odontologoId: cita.odontologoId,
      estado: cita.estado,
      icono: cita.icono,
      fecha: cita.fecha,
      tenantId: cita.tenantId,
    };
    
    setDraggedCita(citaCompleta);
  };

  const handleDragEnd = () => {
    setDraggedCita(null);
    setDragOverSlot(null);
  };

  const handleDragOver = (e: React.DragEvent, fecha: Date, hora: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot({ fecha, hora });
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = async (e: React.DragEvent, fecha: Date, hora: string) => {
    e.preventDefault();
    
    if (!draggedCita) {
      console.error('No hay cita arrastrada');
      return;
    }

    if (!draggedCita.id || !draggedCita.paciente || !draggedCita.odontologo) {
      console.error('Cita incompleta:', draggedCita);
      toast.error("Error: Datos de la cita incompletos");
      return;
    }

    let pacienteId = draggedCita.pacienteId;
    let odontologoId = draggedCita.odontologoId;
    
    if (!pacienteId || !odontologoId) {
      try {
        const citaOriginal = await apiGet(`/citas/${draggedCita.id}`);
        pacienteId = citaOriginal.id_paciente || pacienteId;
        odontologoId = citaOriginal.id_odontologo || odontologoId;
      } catch (error) {
        console.error('Error obteniendo datos de la cita:', error);
      }
    }

    const nuevaHoraInicio = hora;
    const nuevaHoraFin = calcularHoraFin(hora);
    
    const fechaActual = draggedCita.fecha;
    const horaActual = draggedCita.horaInicio;
    
    if (fechaActual && 
        fechaActual.getTime() === fecha.getTime() && 
        horaActual === nuevaHoraInicio) {
      return;
    }

    try {
      const citaActualizada: any = {
        fecha_hora: toGuayaquilISOString(combinarFechaHora(fecha, nuevaHoraInicio)),
        observaciones: draggedCita.descripcion || null,
        estado: draggedCita.estado || "AGENDADA",
        id: draggedCita.id
      };

      if (pacienteId) {
        citaActualizada.id_paciente = pacienteId;
      }
      if (odontologoId) {
        citaActualizada.id_odontologo = odontologoId;
      }
      if (draggedCita.tenantId) {
        citaActualizada.tenantId = draggedCita.tenantId;
      }

      await apiPut(`/citas/${draggedCita.id}`, citaActualizada);
      
      setCitas(prevCitas => 
        prevCitas.map(cita => 
          cita.id === draggedCita.id 
            ? { 
                ...cita,
                fecha: fecha, 
                horaInicio: nuevaHoraInicio, 
                horaFin: nuevaHoraFin
              }
            : cita
        )
      );
      
      toast.success("Cita movida exitosamente");
    } catch (error) {
      console.error("Error moviendo cita:", error);
      toast.error("Error al mover la cita");
    }
    
    setDraggedCita(null);
    setDragOverSlot(null);
  };

  const obtenerHoraActualSistema = () => {
    const ahora = new Date();
    const horas = ahora.getHours().toString().padStart(2, '0');
    const minutos = ahora.getMinutes().toString().padStart(2, '0');
    const horaActual = `${horas}:${minutos}`;
    
    const horaActualNum = parseInt(horas);
    if (horaActualNum > 22) {
      return '22:00';
    }
    
    return horaActual;
  };

  const obtenerPosicionCita = (horaInicio: string) => {
    const [h, m] = horaInicio.split(':');
    const horaNum = parseInt(h);
    const minNum = parseInt(m);
    
    // Calcular minutos totales desde las 10:00 (inicio del día)
    const minutosDesdeInicio = (horaNum - 10) * 60 + minNum;
    
    // Cada minuto = 1px
    return minutosDesdeInicio;
  };

  const obtenerAlturaCita = (horaInicio: string, horaFin: string) => {
    const [h1, m1] = horaInicio.split(':');
    const [h2, m2] = horaFin.split(':');
    
    const inicioTotal = parseInt(h1) * 60 + parseInt(m1);
    const finTotal = parseInt(h2) * 60 + parseInt(m2);
    
    // Diferencia en minutos = píxeles
    return finTotal - inicioTotal;
  };

  // Handler para doble clic en franjas horarias
  const handleDoubleClickOnTimeSlot = (fecha: Date, hora: string) => {
    if (pacienteSeleccionado) {
      // Si hay paciente seleccionado, abrir modal de nueva cita
      setInitialAppointmentData({
        fecha,
        horaInicio: hora,
        horaFin: calcularHoraFin(hora),
        idPaciente: pacienteSeleccionado.id,
        idConsultorio: consultorioFiltro ? Number(consultorioFiltro) : undefined,
        idOdontologo: odontologoFiltro ? Number(odontologoFiltro) : undefined,
      });
      setIsNewAppointmentOpen(true);
    } else {
      // Si no hay paciente seleccionado, guardar fecha y hora temporal y abrir modal de búsqueda
      setTempFechaHora({ fecha, hora });
      setIsPatientSearchOpen(true);
    }
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
      setPacienteSeleccionado(null);
      setInitialAppointmentData(null);
      setTempFechaHora(null);
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
          {pacienteSeleccionado && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">PACIENTE SELECCIONADO</div>
              <div className="text-sm text-gray-900 dark:text-white font-medium">
                {pacienteSeleccionado.nombres} {pacienteSeleccionado.apellidos}
              </div>
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Calendario</h1>
          
          {/* Botones de Accin */}
          <div className="space-y-3 mb-8">
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                if (pacienteSeleccionado) {
                  // Si hay paciente seleccionado, abrir modal de nueva cita
                  setInitialAppointmentData({
                    idPaciente: pacienteSeleccionado.id,
                    idConsultorio: consultorioFiltro ? Number(consultorioFiltro) : undefined,
                    idOdontologo: odontologoFiltro ? Number(odontologoFiltro) : undefined,
                  });
                  setIsNewAppointmentOpen(true);
                } else {
                  // Si no hay paciente seleccionado, abrir modal de búsqueda
                  setIsPatientSearchOpen(true);
                }
              }}
            >
              <CalendarPlus className="w-4 h-4 mr-2" />
              Nuevo evento
            </Button>
          </div>

          {/* Filtro de Clínicas */}
          <div className="space-y-3 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Clínicas</h3>
            
            <div className="space-y-2">
              <Select value={clinicaFiltro || "all"} onValueChange={(value) => setClinicaFiltro(value === "all" ? null : value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas las clínicas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las clínicas</SelectItem>
                  {clinicas.map((clinica) => (
                    <SelectItem key={clinica.id} value={clinica.id.toString()}>
                      {clinica.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Leyenda de Mdicos */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Médicos</h3>
            
            {/* Filtro de odontólogos */}
            <div className="space-y-2">
              <Select value={odontologoFiltro || "all"} onValueChange={(value) => setOdontologoFiltro(value === "all" ? null : value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los médicos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los médicos</SelectItem>
                  {odontologos.map((odontologo) => (
                    <SelectItem key={odontologo.id} value={odontologo.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <div className={cn("w-3 h-3 rounded-full", odontologo.color)}></div>
                        <span>{odontologo.nombre}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lista de médicos */}
            {loadingDoctores ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Cargando médicos...
              </div>
            ) : odontologos.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No hay médicos disponibles
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

          {/* Filtro de Consultorios */}
          <div className="space-y-3 mt-8">
            {clinicaSeleccionada && (
              <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="text-xs text-green-600 dark:text-green-400 font-semibold mb-1">CLÍNICA SELECCIONADA</div>
                <div className="text-sm text-gray-900 dark:text-white font-medium">
                  {clinicaSeleccionada.nombre}
                </div>
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Consultorios</h3>
            
            {loadingDoctores ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Cargando consultorios...
              </div>
            ) : consultorios.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No hay consultorios disponibles
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={consultorioFiltro === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setConsultorioFiltro(null)}
                  className={cn(
                    consultorioFiltro === null && "bg-blue-600 hover:bg-blue-700 text-white"
                  )}
                >
                  Todos
                </Button>
                {consultorios.map((consultorio) => (
                  <Button
                    key={consultorio.id}
                    variant={consultorioFiltro === consultorio.id.toString() ? "default" : "outline"}
                    size="sm"
                    onClick={() => setConsultorioFiltro(consultorio.id.toString())}
                    className={cn(
                      consultorioFiltro === consultorio.id.toString() && "bg-blue-600 hover:bg-blue-700 text-white"
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>{consultorio.nombre}</span>
                    </div>
                  </Button>
                ))}
              </div>
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
                <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <HelpCircle className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsPatientSearchOpen(true)}>
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
                        const horaFormateada = `${hora.toString().padStart(2, '0')}:00`;
                        const esHoraActual = esHoy(fechaSeleccionada) && hora === Math.floor(obtenerHoraActual());
                        const isDragOver = dragOverSlot?.fecha.getTime() === fechaSeleccionada.getTime() && 
                                         dragOverSlot?.hora === horaFormateada;
                        
                        return (
                          <div 
                            key={i} 
                            className={cn(
                              "h-15 border-b border-gray-200 dark:border-gray-600 p-2 relative cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors",
                              isDragOver && "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600"
                            )}
                            style={{ height: '60px' }}
                            onDoubleClick={() => handleDoubleClickOnTimeSlot(fechaSeleccionada, horaFormateada)}
                            onDragOver={(e) => handleDragOver(e, fechaSeleccionada, horaFormateada)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, fechaSeleccionada, horaFormateada)}
                          >
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
                      {Array.from({ length: 14 }, (_, i) => {
                        const hora = 10 + i;
                        const horaFormateada = `${hora.toString().padStart(2, '0')}:00`;
                        const isDragOver = dragOverSlot?.fecha.getTime() === fechaSeleccionada.getTime() && 
                                         dragOverSlot?.hora === horaFormateada;
                        
                        return (
                          <div 
                            key={i} 
                            className={cn(
                              "absolute left-0 right-0 border-t border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors",
                              isDragOver && "bg-blue-200 dark:bg-blue-800 border-blue-400 dark:border-blue-500"
                            )}
                            style={{ top: `${i * 60}px`, height: '60px' }}
                            onDoubleClick={() => handleDoubleClickOnTimeSlot(fechaSeleccionada, horaFormateada)}
                            onDragOver={(e) => handleDragOver(e, fechaSeleccionada, horaFormateada)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, fechaSeleccionada, horaFormateada)}
                          />
                        );
                      })}

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
                      {citasDia
                        .filter((cita) => {
                          const [h] = cita.horaInicio.split(':');
                          const hora = parseInt(h);
                          return hora >= 10 && hora <= 23;
                        })
                        .map((cita) => {
                        const posicion = obtenerPosicionEvento(cita.horaInicio);
                        const altura = obtenerAlturaEvento(cita.horaInicio, cita.horaFin);
                        
                        // Validar que la posición sea positiva (dentro del área visible)
                        if (posicion < 0) {
                          return null;
                        }

                        return (
                          <Tooltip key={`${cita.id}-dia`}>
                            <TooltipTrigger asChild>
                              <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, cita)}
                                onDragEnd={handleDragEnd}
                                className={cn(
                                  "absolute left-2 right-2 rounded-md p-2 text-white text-sm hover:opacity-90 transition-opacity shadow-md group cursor-move",
                                  cita.color,
                                  draggedCita?.id === cita.id && "opacity-50"
                                )}
                                style={{
                                  top: `${posicion}px`,
                                  height: `${altura}px`,
                                  minHeight: '60px',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAppointment(cita);
                                }}
                              >
                                <div className="flex flex-col h-full justify-between">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">{formatearHora(cita.horaInicio)}</span>
                                    <div className="flex items-center space-x-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-4 w-4 p-0 bg-white/20 hover:bg-white/30 border-white/30"
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
                                        className="h-4 w-4 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteAppointment(cita);
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="mt-auto">
                                    <span className="font-semibold text-base leading-tight block">{cita.paciente}</span>
                                  </div>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              {generarContenidoTooltip(cita)}
                            </TooltipContent>
                          </Tooltip>
                        );
                      }).filter(Boolean)}

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
                        const citasDelDia = obtenerCitasDelDia(dia, citasFiltradas);
                        const esHoyDia = esHoy(dia);
                        const esDelMes = esDelMesActual(dia);
                        const isDragTarget = draggedCita && esDelMes;
                        
                        return (
                        <div
                          key={index}
                          className={cn(
                            "min-h-[120px] p-2 border-r border-b border-gray-200 dark:border-gray-600 last:border-r-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                            !esDelMes && "bg-gray-50 dark:bg-gray-900 text-gray-400",
                            esHoyDia && "bg-blue-50 dark:bg-blue-900/20",
                            isDragTarget && "bg-blue-100 dark:bg-blue-800/30 border-blue-300 dark:border-blue-500 border-2"
                          )}
                          onDoubleClick={() => {
                            const horaActual = obtenerHoraActualSistema();
                            handleDoubleClickOnTimeSlot(dia, horaActual);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (!draggedCita) return;
                            
                            // Por defecto, usar la hora actual cuando se arrastra al mes
                            const horaActual = obtenerHoraActualSistema();
                            handleDrop(e, dia, horaActual);
                          }}
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
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, cita)}
                                    onDragEnd={handleDragEnd}
                                    className={cn(
                                      "text-xs p-1 rounded hover:opacity-80 transition-opacity group cursor-move",
                                      cita.color,
                                      "text-white",
                                      draggedCita?.id === cita.id && "opacity-50"
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
                            const horaFormateada = `${hora.toString().padStart(2, '0')}:00`;
                            return (
                              <div 
                                key={i} 
                                className="h-15 border-b border-gray-200 dark:border-gray-600 p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                style={{ height: '60px' }}
                                onDoubleClick={() => handleDoubleClickOnTimeSlot(fechaActual, horaFormateada)}
                              >
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {hora}:00 {hora < 12 ? 'am' : 'pm'}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Columnas de Das */}
                        {diasSemana.map((dia, diaIndex) => {
                          // Obtener citas para este día
                          const citasDelDia = obtenerCitasDelDia(dia, citasFiltradas);
                          
                          return (
                            <div key={diaIndex} className="relative border-l border-gray-200 dark:border-gray-700">
                              {Array.from({ length: 11 }, (_, i) => {
                                const hora = 10 + i;
                                const horaFormateada = `${hora.toString().padStart(2, '0')}:00`;
                                const isDragOver = dragOverSlot?.fecha.getTime() === dia.getTime() && 
                                                 dragOverSlot?.hora === horaFormateada;
                                
                                return (
                                  <div 
                                    key={i} 
                                    className={cn(
                                      "h-15 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors",
                                      isDragOver && "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600"
                                    )}
                                    style={{ height: '60px' }}
                                    onDoubleClick={() => handleDoubleClickOnTimeSlot(dia, horaFormateada)}
                                    onDragOver={(e) => handleDragOver(e, dia, horaFormateada)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, dia, horaFormateada)}
                                  ></div>
                                );
                              })}

                              {/* Citas del día - Ahora habilitado en vista semana */}
                              {citasDelDia
                                .filter((cita) => {
                                  const [h] = cita.horaInicio.split(':');
                                  const hora = parseInt(h);
                                  return hora >= 10 && hora <= 23;
                                })
                                .map((cita) => {
                                  const posicion = obtenerPosicionCita(cita.horaInicio);
                                  const altura = obtenerAlturaCita(cita.horaInicio, cita.horaFin);
                                  
                                  // Validar que la posición sea positiva (dentro del área visible)
                                  if (posicion < 0 || posicion > 660) {
                                    return null;
                                  }

                                  return (
                                    <Tooltip key={`${cita.id}-semana`}>
                                      <TooltipTrigger asChild>
                                        <div
                                          draggable
                                          onDragStart={(e) => handleDragStart(e, cita)}
                                          onDragEnd={handleDragEnd}
                                          className={cn(
                                            "absolute left-1 right-1 rounded-md p-2 text-white text-sm hover:opacity-90 transition-opacity shadow-md group cursor-move",
                                            cita.color,
                                            draggedCita?.id === cita.id && "opacity-50"
                                          )}
                                          style={{
                                            top: `${posicion}px`,
                                            height: `${altura}px`,
                                            minHeight: '60px'
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditAppointment(cita);
                                          }}
                                        >
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-sm">{formatearHora(cita.horaInicio)}</span>
                                            <div className="flex items-center space-x-1">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-5 w-5 p-0 bg-white/20 hover:bg-white/30 border-white/30"
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
                                                className="h-5 w-5 p-0"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteAppointment(cita);
                                                }}
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </div>
                                          <div className="truncate font-semibold text-sm">{cita.paciente}</div>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-xs">
                                        {generarContenidoTooltip(cita)}
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                }).filter(Boolean)}
                            </div>
                          );
                        })}
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
        onClose={() => {
          setIsNewAppointmentOpen(false);
          setInitialAppointmentData(null);
          setTempFechaHora(null);
        }}
        onSave={handleNewAppointment}
        odontologos={odontologos}
        isSubmitting={creatingAppointment}
        initialData={initialAppointmentData}
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

      {/* Modal de Búsqueda de Pacientes */}
      <PatientSearchModal
        isOpen={isPatientSearchOpen}
        onClose={() => {
          setIsPatientSearchOpen(false);
          setTempFechaHora(null); // Limpiar fecha y hora temporal
        }}
        onSelectPatient={(paciente) => {
          toast.success(`Paciente seleccionado: ${paciente.nombres} ${paciente.apellidos}`);
          
          // Guardar paciente seleccionado
          setPacienteSeleccionado({
            id: paciente.id_paciente,
            nombres: paciente.nombres,
            apellidos: paciente.apellidos,
          });
          
          // Cerrar modal de búsqueda y abrir modal de nueva cita con el paciente preseleccionado
          setIsPatientSearchOpen(false);
          
          // Si hay fecha y hora temporal (de doble clic), usarlas
          const initialData: any = {
            idPaciente: paciente.id_paciente,
            idConsultorio: consultorioFiltro ? Number(consultorioFiltro) : undefined,
            idOdontologo: odontologoFiltro ? Number(odontologoFiltro) : undefined,
          };
          
          if (tempFechaHora?.fecha && tempFechaHora?.hora) {
            initialData.fecha = tempFechaHora.fecha;
            initialData.horaInicio = tempFechaHora.hora;
            initialData.horaFin = calcularHoraFin(tempFechaHora.hora);
          }
          
          setInitialAppointmentData(initialData);
          setIsNewAppointmentOpen(true);
          setTempFechaHora(null); // Limpiar fecha y hora temporal
        }}
      />
      </div>
    </TooltipProvider>
  );
};

export default Calendar;




// Constantes de estados y tipos
export const APPOINTMENT_STATUS = {
  AGENDADA: 'AGENDADA',
  CONFIRMADA: 'CONFIRMADA',
  EN_PROGRESO: 'EN_PROGRESO',
  COMPLETADA: 'COMPLETADA',
  CANCELADA: 'CANCELADA',
  NO_ASISTIO: 'NO_ASISTIO',
} as const;

export const PATIENT_STATUS = {
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO',
  SUSPENDIDO: 'SUSPENDIDO',
} as const;

export const USER_STATUS = {
  ACTIVO: true,
  INACTIVO: false,
} as const;

export const PAYMENT_STATUS = {
  PENDIENTE: 'PENDIENTE',
  PAGADO: 'PAGADO',
  CANCELADO: 'CANCELADO',
  REEMBOLSADO: 'REEMBOLSADO',
} as const;

export const PAYMENT_METHODS = {
  EFECTIVO: 'EFECTIVO',
  TARJETA: 'TARJETA',
  TRANSFERENCIA: 'TRANSFERENCIA',
  CHEQUE: 'CHEQUE',
} as const;

export const CALENDAR_VIEWS = {
  DIA: 'dia',
  SEMANA: 'semana',
  MES: 'mes',
} as const;

export const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
] as const;

export const DEFAULT_APPOINTMENT_DURATION = 60; // minutos

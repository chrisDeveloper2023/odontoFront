// Constantes de UI y diseño
export const COLORS = {
  PRIMARY: 'bg-primary',
  SECONDARY: 'bg-secondary',
  SUCCESS: 'bg-green-500',
  WARNING: 'bg-yellow-500',
  ERROR: 'bg-red-500',
  INFO: 'bg-blue-500',
} as const;

export const DOCTOR_COLORS = [
  'bg-pink-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
] as const;

export const ESTADO_COLOR = {
  AGENDADA: 'bg-slate-400',
  CONFIRMADA: 'bg-blue-500',
  EN_PROGRESO: 'bg-yellow-500',
  COMPLETADA: 'bg-green-500',
  CANCELADA: 'bg-red-500',
  NO_ASISTIO: 'bg-gray-500',
} as const;

export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
} as const;

export const SPACING = {
  XS: '0.25rem',
  SM: '0.5rem',
  MD: '1rem',
  LG: '1.5rem',
  XL: '2rem',
  '2XL': '3rem',
} as const;

export const ANIMATION_DURATION = {
  FAST: '150ms',
  NORMAL: '300ms',
  SLOW: '500ms',
} as const;

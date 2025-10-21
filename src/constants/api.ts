// Constantes relacionadas con la API
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
} as const;

export const API_ENDPOINTS = {
  // Autenticación
  LOGIN: '/auth/login',
  REFRESH_TOKEN: '/auth/refresh',
  LOGOUT: '/auth/logout',
  
  // Usuarios
  USUARIOS: '/usuarios',
  ROLES: '/roles',
  
  // Pacientes
  PACIENTES: '/pacientes',
  
  // Citas
  CITAS: '/citas',
  DISPONIBILIDAD: '/citas/disponibilidad',
  
  // Clínicas
  CLINICAS: '/clinicas',
  
  // Consultorios
  CONSULTORIOS: '/consultorios',
  
  // Notificaciones
  NOTIFICACIONES: '/notificaciones',
  
  // Pagos
  PAGOS: '/pagos',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

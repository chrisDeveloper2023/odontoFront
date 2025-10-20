// Constantes de validación
export const VALIDATION_RULES = {
  // Nombres y apellidos
  NOMBRE_MIN_LENGTH: 2,
  NOMBRE_MAX_LENGTH: 50,
  NOMBRE_PATTERN: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
  
  // Email
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  EMAIL_MAX_LENGTH: 100,
  
  // Teléfono
  PHONE_PATTERN: /^[\+]?[0-9\s\-\(\)]{7,15}$/,
  
  // Cédula/RUC
  CEDULA_PATTERN: /^[0-9]{10}$/,
  RUC_PATTERN: /^[0-9]{13}$/,
  
  // Contraseña
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  
  // Observaciones y descripciones
  OBSERVACIONES_MAX_LENGTH: 500,
  DESCRIPCION_MAX_LENGTH: 200,
  
  // Dirección
  DIRECCION_MAX_LENGTH: 200,
  
  // Fechas
  MIN_DATE: '1900-01-01',
  MAX_DATE: '2100-12-31',
} as const;

export const FORM_LIMITS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  SEARCH_MIN_LENGTH: 2,
  SEARCH_MAX_LENGTH: 50,
} as const;

export const FILE_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

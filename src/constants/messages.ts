// Constantes de mensajes
export const SUCCESS_MESSAGES = {
  USER_CREATED: 'Usuario creado exitosamente',
  USER_UPDATED: 'Usuario actualizado exitosamente',
  USER_DELETED: 'Usuario eliminado exitosamente',
  
  PATIENT_CREATED: 'Paciente creado exitosamente',
  PATIENT_UPDATED: 'Paciente actualizado exitosamente',
  PATIENT_DELETED: 'Paciente eliminado exitosamente',
  
  APPOINTMENT_CREATED: 'Cita creada exitosamente',
  APPOINTMENT_UPDATED: 'Cita actualizada exitosamente',
  APPOINTMENT_DELETED: 'Cita eliminada exitosamente',
  
  CLINIC_CREATED: 'Clínica creada exitosamente',
  CLINIC_UPDATED: 'Clínica actualizada exitosamente',
  CLINIC_DELETED: 'Clínica eliminada exitosamente',
  
  MEDICAL_RECORD_CREATED: 'Historia clínica creada exitosamente',
  MEDICAL_RECORD_UPDATED: 'Historia clínica actualizada exitosamente',
  
  PAYMENT_CREATED: 'Pago registrado exitosamente',
  PAYMENT_UPDATED: 'Pago actualizado exitosamente',
  
  DATA_SAVED: 'Datos guardados exitosamente',
  DATA_UPDATED: 'Datos actualizados exitosamente',
  DATA_DELETED: 'Datos eliminados exitosamente',
} as const;

export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Este campo es obligatorio',
  INVALID_EMAIL: 'Ingresa un email válido',
  INVALID_PHONE: 'Ingresa un teléfono válido',
  INVALID_CEDULA: 'Ingresa una cédula válida (10 dígitos)',
  INVALID_RUC: 'Ingresa un RUC válido (13 dígitos)',
  INVALID_PASSWORD: 'La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos',
  
  NAME_TOO_SHORT: 'El nombre debe tener al menos 2 caracteres',
  NAME_TOO_LONG: 'El nombre no puede exceder 50 caracteres',
  NAME_INVALID_CHARS: 'El nombre solo puede contener letras y espacios',
  
  EMAIL_TOO_LONG: 'El email no puede exceder 100 caracteres',
  EMAIL_ALREADY_EXISTS: 'Este email ya está registrado',
  
  PHONE_INVALID_FORMAT: 'Formato de teléfono inválido',
  
  PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres',
  PASSWORD_WEAK: 'La contraseña debe ser más segura',
  PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden',
  
  DATE_INVALID: 'Fecha inválida',
  DATE_TOO_EARLY: 'La fecha no puede ser anterior a 1900',
  DATE_TOO_LATE: 'La fecha no puede ser posterior a 2100',
  
  FILE_TOO_LARGE: 'El archivo es demasiado grande (máximo 5MB)',
  FILE_TYPE_INVALID: 'Tipo de archivo no permitido',
  
  NETWORK_ERROR: 'Error de conexión. Verifica tu internet',
  SERVER_ERROR: 'Error del servidor. Intenta más tarde',
  UNAUTHORIZED: 'No tienes permisos para realizar esta acción',
  FORBIDDEN: 'Acceso denegado',
  NOT_FOUND: 'Recurso no encontrado',
  
  GENERIC_ERROR: 'Ha ocurrido un error inesperado',
  VALIDATION_ERROR: 'Por favor corrige los errores en el formulario',
} as const;

export const INFO_MESSAGES = {
  LOADING: 'Cargando...',
  SAVING: 'Guardando...',
  DELETING: 'Eliminando...',
  PROCESSING: 'Procesando...',
  
  NO_DATA: 'No hay datos disponibles',
  NO_RESULTS: 'No se encontraron resultados',
  NO_USERS: 'No hay usuarios registrados',
  NO_PATIENTS: 'No hay pacientes registrados',
  NO_APPOINTMENTS: 'No hay citas programadas',
  NO_CLINICS: 'No hay clínicas registradas',
  
  CONFIRM_DELETE: '¿Estás seguro de que deseas eliminar este elemento?',
  CONFIRM_CANCEL: '¿Estás seguro de que deseas cancelar? Los cambios no guardados se perderán.',
  
  PASSWORD_COPIED: 'Contraseña copiada al portapapeles',
  DATA_EXPORTED: 'Datos exportados exitosamente',
  DATA_IMPORTED: 'Datos importados exitosamente',
} as const;

export const PLACEHOLDERS = {
  SEARCH: 'Buscar...',
  SELECT_OPTION: 'Selecciona una opción',
  SELECT_DATE: 'Selecciona una fecha',
  SELECT_TIME: 'Selecciona una hora',
  ENTER_NAME: 'Ingresa el nombre',
  ENTER_EMAIL: 'Ingresa el email',
  ENTER_PHONE: 'Ingresa el teléfono',
  ENTER_DESCRIPTION: 'Ingresa una descripción',
  ENTER_OBSERVATIONS: 'Ingresa observaciones',
} as const;

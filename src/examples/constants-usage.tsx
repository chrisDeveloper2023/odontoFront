// Ejemplo de uso de constantes en componentes
import { 
  API_ENDPOINTS, 
  HTTP_STATUS, 
  COLORS, 
  DOCTOR_COLORS, 
  ESTADO_COLOR,
  USER_ROLES,
  PERMISSIONS,
  APPOINTMENT_STATUS,
  VALIDATION_RULES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  TIME_SLOTS,
  DEFAULT_APPOINTMENT_DURATION
} from '@/constants';

// Ejemplo de uso en un componente
export const ExampleComponent = () => {
  // Usar constantes de API
  const fetchUsers = async () => {
    const response = await fetch(API_ENDPOINTS.USUARIOS);
    if (response.status === HTTP_STATUS.OK) {
      return response.json();
    }
  };

  // Usar constantes de UI
  const getDoctorColor = (index: number) => {
    return DOCTOR_COLORS[index % DOCTOR_COLORS.length];
  };

  const getStatusColor = (status: string) => {
    return ESTADO_COLOR[status as keyof typeof ESTADO_COLOR] || COLORS.PRIMARY;
  };

  // Usar constantes de validación
  const validateEmail = (email: string) => {
    if (!VALIDATION_RULES.EMAIL_PATTERN.test(email)) {
      return ERROR_MESSAGES.INVALID_EMAIL;
    }
    return null;
  };

  // Usar constantes de mensajes
  const showSuccess = () => {
    toast.success(SUCCESS_MESSAGES.USER_CREATED);
  };

  return (
    <div>
      {/* Usar constantes de tiempo */}
      <select>
        {TIME_SLOTS.map(time => (
          <option key={time} value={time}>{time}</option>
        ))}
      </select>
      
      {/* Usar constantes de duración */}
      <input 
        type="number" 
        defaultValue={DEFAULT_APPOINTMENT_DURATION}
        placeholder="Duración en minutos"
      />
    </div>
  );
};

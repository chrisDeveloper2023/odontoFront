// src/servicios/pacientes.ts
import { apiGet, apiPost, apiPut } from "@/api/client";

export interface Paciente {
  id: number;
  id_clinica: number;
  tipo_documento: string;
  documento_identidad: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  telefono: string;
  correo?: string;
  direccion?: string;
  observaciones?: string;
  sexo: string;
}

export interface ValidacionDocumentoResponse {
  existe: boolean;
  paciente?: Paciente;
}

/**
 * Valida si un número de documento ya existe en la base de datos
 * @param documentoId - Número de documento a validar
 * @param tipoDocumento - Tipo de documento (Cédula, Pasaporte, etc.)
 * @returns Promise<ValidacionDocumentoResponse> - Indica si el documento existe y opcionalmente el paciente
 */
export const validarDocumentoExistente = async (
  documentoId: string,
  tipoDocumento: string
): Promise<ValidacionDocumentoResponse> => {
  try {
    // Buscar pacientes con el mismo documento
    const pacientes = await apiGet<Paciente[]>("/pacientes", {
      documento_identidad: documentoId,
      tipo_documento: tipoDocumento
    });

    const pacienteExistente = pacientes.find(
      paciente => 
        paciente.documento_identidad === documentoId && 
        paciente.tipo_documento === tipoDocumento
    );

    return {
      existe: Boolean(pacienteExistente),
      paciente: pacienteExistente
    };
  } catch (error) {
    console.error("Error al validar documento:", error);
    throw new Error("Error al validar el documento. Intenta nuevamente.");
  }
};

/**
 * Obtiene un paciente por su ID
 * @param id - ID del paciente
 * @returns Promise<Paciente>
 */
export const obtenerPacientePorId = async (id: number): Promise<Paciente> => {
  return apiGet<Paciente>(`/pacientes/${id}`);
};

/**
 * Crea un nuevo paciente
 * @param paciente - Datos del paciente
 * @returns Promise<Paciente>
 */
export const crearPaciente = async (paciente: Omit<Paciente, 'id'>): Promise<Paciente> => {
  return apiPost<Paciente>("/pacientes", paciente);
};

/**
 * Actualiza un paciente existente
 * @param id - ID del paciente
 * @param paciente - Datos actualizados del paciente
 * @returns Promise<Paciente>
 */
export const actualizarPaciente = async (id: number, paciente: Partial<Paciente>): Promise<Paciente> => {
  return apiPut<Paciente>(`/pacientes/${id}`, paciente);
};

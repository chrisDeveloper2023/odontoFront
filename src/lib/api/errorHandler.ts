export function handleApiError(error: any): string {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.mensaje) return error.response.data.mensaje;
  if (error?.message) return error.message;
  return "Error inesperado del servidor.";
}

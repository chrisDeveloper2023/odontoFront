import { apiGet } from "@/api/client";

type ClinicaRaw = {
  id?: number;
  id_clinica?: number;
  idClinica?: number;
  clinica_id?: number;
  nombre?: string;
  nombre_clinica?: string;
  name?: string;
};

export async function getClinicas(): Promise<ClinicaRaw[]> {
  const res = await apiGet<any>("/clinicas");
  if (Array.isArray(res)) {
    return res;
  }
  if (res && typeof res === "object" && Array.isArray(res.data)) {
    return res.data as ClinicaRaw[];
  }
  return [];
}

// src/servicios/apiClinicas.ts
import { useEffect, useState } from "react";
import axios from "axios";

export interface Clinica {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  correo: string;
  activo: boolean;
}

// Si tu endpoint es paginado (devuelve { total, page, limit, totalPages, data: Clinica[] })
interface PaginatedResponse {
  data?: Clinica[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export function useClinicas(page = 1, limit = 0) {
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCargando(true);
    axios
      .get<PaginatedResponse>(`${import.meta.env.VITE_API_URL}/clinicas?page=${page}&limit=${limit}`)
      .then(res => {
        // Puede venir en res.data.data (paginado)
        // o en res.data directamente (array sin paginar)
        const body = res.data;
        if (Array.isArray((body as any).data)) {
          setClinicas((body as any).data);
        } else if (Array.isArray(body as any)) {
          setClinicas(body as any);
        } else {
          setClinicas([]); // garantía de que siempre sea array
        }
      })
      .catch(err => {
        console.error(err);
        setError("No se pudieron cargar las clínicas");
      })
      .finally(() => setCargando(false));
  }, [page, limit]);

  return { clinicas, cargando, error };
}

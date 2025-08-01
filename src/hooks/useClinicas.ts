import { useEffect, useState } from "react";
import axios from "axios";

export function useClinicas() {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    axios.get("http://optimus:3005/clinicas")
      .then((response) => {
        setDatos(response.data);
        setCargando(false);
      })
      .catch((error) => {
        console.error("Hubo un error:", error);
        setError("Error al obtener clínicas");
        setCargando(false);
      });
  }, []);

  return { datos, cargando, error };
}

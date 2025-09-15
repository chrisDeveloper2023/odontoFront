import { useEffect, useState } from "react";
import axios from "axios";

function AppClinicas() {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    axios.get("/api/clinicas")
      .then((response) => {
        setDatos(response.data);
        setCargando(false);
      })
      .catch((error) => {
        console.error("Hubo un error:", error);
        setCargando(false);
      });
  }, []);

  if (cargando) return <p>Cargando...</p>;

  return (
    <div>
      <h1>Datos desde la API</h1>
      <pre>{JSON.stringify(datos, null, 2)}</pre>
    </div>
  );
}

export default App;

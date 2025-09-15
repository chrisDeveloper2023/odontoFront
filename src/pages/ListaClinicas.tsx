// src/pages/ListaClinicas.tsx
import { useClinicas } from "../servicios/apiClinicas";

const ListaClinicas = () => {
  const { clinicas, cargando, error } = useClinicas();

  if (cargando) return <p>Cargando clínicas...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Listado de Clínicas</h2>
      <table className="table-auto border-collapse border border-gray-400 w-full">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">Nombre</th>
            <th className="border p-2">Dirección</th>
            <th className="border p-2">Teléfono</th>
            <th className="border p-2">Correo</th>
            <th className="border p-2">Activo</th>
          </tr>
        </thead>
        <tbody>
          {clinicas.map(clinica => (
            <tr key={clinica.id}>
              <td className="border p-2">{clinica.id}</td>
              <td className="border p-2">{clinica.nombre}</td>
              <td className="border p-2">{clinica.direccion}</td>
              <td className="border p-2">{clinica.telefono}</td>
              <td className="border p-2">{clinica.correo}</td>
              <td className="border p-2">{clinica.activo ? "Sí" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListaClinicas;

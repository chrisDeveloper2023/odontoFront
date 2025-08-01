import { useClinicas } from "../hooks/useClinicas";

const ListadoClinicas = () => {
  const { datos, cargando, error } = useClinicas();

  if (cargando) return <p>Cargando clínicas...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>Listado de Clínicas</h2>
      <ul>
        {datos.map((clinica: any) => (
          <li key={clinica.id}>{clinica.nombre}</li>
        ))}
      </ul>
    </div>
  );
};

export default ListadoClinicas;

import ClinicsTable from "@/components/ClinicsTable";
import { useClinicas } from "@/servicios/clinicas";

const ClinicsPage = () => {
  const { clinics, loading, error, refetch } = useClinicas();

  return (
    <div className="space-y-6">
      <ClinicsTable clinics={clinics} loading={loading} error={error} onRetry={refetch} />
    </div>
  );
};

export default ClinicsPage;

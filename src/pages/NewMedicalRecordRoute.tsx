import { useCallback } from "react";
import { useLocation, useNavigate, useSearchParams, type Location } from "react-router-dom";
import RouteModal from "@/components/RouteModal";
import PatientSearchModal from "@/components/PatientSearchModal";
import { MedicalRecordForm } from "@/components/medical-records/MedicalRecordForm";
import { useNewMedicalRecordForm } from "@/components/medical-records/useNewMedicalRecordForm";

const NewMedicalRecordRoute = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const preselectedPatient = searchParams.get("patientId") || "";

  const {
    form,
    patients,
    clinicas,
    citasDisponibles,
    loading,
    loadingCitas,
    saving,
    updateField,
    submit,
    resetForm,
    selectedPatientName,
    showPatientSearchModal,
    setShowPatientSearchModal,
    openPatientSearchModal,
    handlePatientSelect,
  } = useNewMedicalRecordForm({
    active: true,
    preselectedPatientId: preselectedPatient,
  });

  const handleDismiss = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const handleCancel = useCallback(() => {
    resetForm();
    navigate(-1);
  }, [resetForm, navigate]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const result = await submit();
      if (!result) {
        return;
      }

      const historiaId = result?.id_historia ?? result?.id ?? null;
      resetForm();
      if (historiaId) {
        const background = (location.state as { background?: Location })?.background;
        navigate(`/medical-records/${historiaId}`, {
          replace: true,
          state: background ? { background } : undefined,
        });
      } else {
        navigate(-1);
      }
    },
    [submit, resetForm, navigate, location.state],
  );

  return (
    <>
      <RouteModal title="Nueva Historia Clinica" onClose={handleDismiss}>
        <MedicalRecordForm
          form={form}
          patients={patients}
          clinicas={clinicas}
          citasDisponibles={citasDisponibles}
          loading={loading}
          loadingCitas={loadingCitas}
          saving={saving}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onReset={resetForm}
          updateField={updateField}
          onOpenPatientSearch={openPatientSearchModal}
          selectedPatientName={selectedPatientName}
        />
      </RouteModal>
      
      <PatientSearchModal
        isOpen={showPatientSearchModal}
        onClose={() => setShowPatientSearchModal(false)}
        onSelectPatient={handlePatientSelect}
      />
    </>
  );
};

export default NewMedicalRecordRoute;

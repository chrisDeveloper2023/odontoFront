import { useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MedicalRecordForm } from "@/components/medical-records/MedicalRecordForm";
import { useNewMedicalRecordForm } from "@/components/medical-records/useNewMedicalRecordForm";

interface NewMedicalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPatientId?: string;
  onMedicalRecordCreated?: (medicalRecord: any) => void;
}

const NewMedicalRecordModal: React.FC<NewMedicalRecordModalProps> = ({
  isOpen,
  onClose,
  preselectedPatientId = "",
  onMedicalRecordCreated,
}) => {
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
  } = useNewMedicalRecordForm({
    active: isOpen,
    preselectedPatientId,
  });

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const result = await submit();
      if (result) {
        onMedicalRecordCreated?.(result);
        resetForm();
        onClose();
      }
    },
    [submit, onMedicalRecordCreated, resetForm, onClose],
  );

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Historia Clínica</DialogTitle>
        </DialogHeader>
        <MedicalRecordForm
          form={form}
          patients={patients}
          clinicas={clinicas}
          citasDisponibles={citasDisponibles}
          loading={loading}
          loadingCitas={loadingCitas}
          saving={saving}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          onReset={resetForm}
          updateField={updateField}
        />
      </DialogContent>
    </Dialog>
  );
};

export default NewMedicalRecordModal;

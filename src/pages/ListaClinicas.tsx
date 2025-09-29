import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ClinicsTable from "@/components/ClinicsTable";
import ClinicForm from "@/components/ClinicForm";
import { useClinicas, deleteClinic, createClinic, updateClinic, Clinic, ClinicPayload } from "@/servicios/clinicas";
import { toast } from "sonner";

const ClinicsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clinics, loading, error, refetch } = useClinicas();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);

  const closeModal = () => {
    setModalOpen(false);
    setEditingClinic(null);
  };

  const handleCreateClick = () => {
    setEditingClinic(null);
    setModalOpen(true);
  };

  const handleEditClick = (clinic: Clinic) => {
    setEditingClinic(clinic);
    setModalOpen(true);
  };

  const handleDelete = async (clinic: Clinic) => {
    if (!window.confirm(`Eliminar la clinica "${clinic.nombre}"?`)) {
      return;
    }
    try {
      await deleteClinic(clinic.id);
      toast.success("Clinica eliminada correctamente");
      refetch();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar la clinica");
    }
  };

  const handleSubmit = async (payload: ClinicPayload) => {
    try {
      setSaving(true);
      if (editingClinic) {
        await updateClinic(editingClinic.id, payload);
        toast.success("Clinica actualizada correctamente");
      } else {
        await createClinic(payload);
        toast.success("Clinica registrada correctamente");
      }
      closeModal();
      refetch();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la clinica");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("action") === "new") {
      handleCreateClick();
      navigate("/clinics", { replace: true });
    }
  }, [location.search]);

  return (
    <div className="space-y-6">
      <ClinicsTable
        clinics={clinics}
        loading={loading}
        error={error}
        onRetry={refetch}
        onCreate={handleCreateClick}
        onEdit={handleEditClick}
        onDelete={handleDelete}
      />

      <Dialog open={modalOpen} onOpenChange={(open) => (open ? setModalOpen(true) : closeModal())}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingClinic ? "Editar clinica" : "Registrar clinica"}</DialogTitle>
          </DialogHeader>
          <ClinicForm
            initialClinic={editingClinic}
            onSubmit={handleSubmit}
            onCancel={closeModal}
            saving={saving}
            submitLabel={editingClinic ? "Actualizar clinica" : "Registrar clinica"}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClinicsPage;


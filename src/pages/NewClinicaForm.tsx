import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ClinicForm from "@/components/ClinicForm";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { createClinic, fetchClinic, updateClinic, ClinicPayload, Clinic } from "@/servicios/clinicas";

const NewClinicForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const clinicId = id ? Number(id) : null;
  const isEdit = Number.isFinite(clinicId);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [initialClinic, setInitialClinic] = useState<Clinic | null>(null);

  useEffect(() => {
    if (!isEdit || clinicId === null) return;

    async function loadClinic() {
      try {
        setLoading(true);
        const clinic = await fetchClinic(clinicId);
        if (!clinic) {
          toast.error("Clinica no encontrada");
          navigate("/clinics", { replace: true });
          return;
        }
        setInitialClinic(clinic);
      } catch (err) {
        console.error(err);
        toast.error("No se pudo cargar la clinica");
        navigate("/clinics", { replace: true });
      } finally {
        setLoading(false);
      }
    }

    loadClinic();
  }, [clinicId, isEdit, navigate]);

  const handleSubmit = async (payload: ClinicPayload) => {
    try {
      setSaving(true);
      if (isEdit && clinicId !== null) {
        await updateClinic(clinicId, payload);
        toast.success("Clinica actualizada correctamente");
      } else {
        await createClinic(payload);
        toast.success("Clinica registrada correctamente");
      }
      navigate("/clinics");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la clinica");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Cargando clinica...</div>;
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEdit ? "Editar clinica" : "Registrar clinica"}</CardTitle>
        <CardDescription>
          {isEdit ? "Actualiza la informacion basica de la clinica" : "Completa la informacion basica de la clinica"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ClinicForm
          initialClinic={initialClinic ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/clinics")}
          saving={saving}
          submitLabel={isEdit ? "Actualizar clinica" : "Registrar clinica"}
          showResetButton={!isEdit}
        />
      </CardContent>
    </Card>
  );
};

export default NewClinicForm;


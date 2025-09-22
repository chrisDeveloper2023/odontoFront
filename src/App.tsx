// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientDetail from "./pages/PatientDetail";
import NewPatient from "./pages/NewPatient";
import MedicalRecords from "./pages/MedicalRecords";
import MedicalRecordDetail from "./pages/MedicalRecordDetail";
import NewMedicalRecord from "./pages/NewMedicalRecord";
import NotFound from "./pages/NotFound";
import NewPaciente from "./pages/NuevosPacientes";
import NewAppointmentForm from "./pages/NewAppointmentForm";
import Appointments from "./pages/Appointments";
import NewClinicForm from "./pages/NewClinicaForm";
import ListaClinicas from "./pages/ListaClinicas";
import CalendarPage from "./pages/Calendar";
import AppointmentDetail from "./pages/AppointmentDetail";
import AppointmentEdit from "./pages/AppointmentEdit";
import OdontogramPage from "./pages/Odontograma";
import RouteModal from "@/components/RouteModal";
import { initTenant } from "@/lib/tenant";

const queryClient = new QueryClient();

// Inicializa tenant (set default en dev, parche fetch, set header en axios)
initTenant();

function AppRoutes() {
  const location = useLocation();
  const state = location.state as { background?: Location } | undefined;

  return (
    <>
      {/* Rutas base */}
      <Routes location={state?.background || location}>
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/patients" element={<Layout><Patients /></Layout>} />
        <Route path="/patients/:id" element={<Layout><PatientDetail /></Layout>} />
        <Route path="/patients/new" element={<Layout><NewPatient /></Layout>} />
        <Route path="/patients/:id/edit" element={<Layout><NewPatient /></Layout>} />
        <Route path="/medical-records" element={<Layout><MedicalRecords /></Layout>} />
        <Route path="/medical-records/new" element={<Layout><NewMedicalRecord /></Layout>} />
        <Route path="/medical-records/:id" element={<Layout><MedicalRecordDetail /></Layout>} />
        <Route path="/NuevosPacientes" element={<Layout><Patients /></Layout>} />
        <Route path="/NuevosPacientes/new" element={<Layout><NewPaciente /></Layout>} />
        <Route path="/appointments" element={<Layout><Appointments /></Layout>} />
        <Route path="/appointments/new" element={<Layout><NewAppointmentForm /></Layout>} />
        <Route path="/calendar" element={<Layout><CalendarPage /></Layout>} />
        <Route path="/clinics/new" element={<Layout><NewClinicForm /></Layout>} />
        <Route path="/ListaClinicas" element={<Layout><ListaClinicas /></Layout>} />
        <Route path="appointments/:id" element={<AppointmentDetail />} />
        <Route path="appointments/:id/edit" element={<AppointmentEdit />} />
        <Route path="odontograma" element={<OdontogramPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Overlays modal cuando hay background */}
      {state?.background && (
        <Routes>
          {/* Pacientes */}
          <Route
            path="/patients/:id"
            element={
              <RouteModal title="Detalle de Paciente">
                <PatientDetail />
              </RouteModal>
            }
          />
          <Route
            path="/patients/:id/edit"
            element={
              <RouteModal title="Editar Paciente">
                <NewPatient />
              </RouteModal>
            }
          />

          {/* Citas */}
          <Route
            path="appointments/:id"
            element={
              <RouteModal title="Detalle de Cita">
                <AppointmentDetail />
              </RouteModal>
            }
          />
          <Route
            path="appointments/:id/edit"
            element={
              <RouteModal title="Editar Cita">
                <AppointmentEdit />
              </RouteModal>
            }
          />
          <Route
            path="/appointments/new"
            element={
              <RouteModal title="Nueva Cita">
                <NewAppointmentForm />
              </RouteModal>
            }
          />

          {/* Historias Clínicas */}
          <Route
            path="/medical-records/new"
            element={
              <RouteModal title="Abrir/Crear Historia Clínica">
                <NewMedicalRecord />
              </RouteModal>
            }
          />
          <Route
            path="/medical-records/:id"
            element={
              <RouteModal title="Historia Clínica">
                <MedicalRecordDetail />
              </RouteModal>
            }
          />

          {/* Pacientes: creación como modal */}
          <Route
            path="/patients/new"
            element={
              <RouteModal title="Nuevo Paciente">
                <NewPatient />
              </RouteModal>
            }
          />
        </Routes>
      )}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

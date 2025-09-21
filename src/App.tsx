// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
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
import AppointmentDetail from "./pages/AppointmentDetail";
import AppointmentEdit from "./pages/AppointmentEdit";
import OdontogramPage from "./pages/Odontograma";
import Calendar from "./pages/Calendar";
import RouteModal from "@/components/RouteModal";
import Login from "./pages/Login";
import LoginSimple from "./pages/LoginSimple";
import ProtectedRoute from "./components/ProtectedRoute";
import { authService } from "@/services/auth";

const queryClient = new QueryClient();

function AppRoutes() {
  const location = useLocation();
  const state = location.state as { background?: Location } | undefined;

  return (
    <>
      {/* Rutas base: si hay background, renderiza el fondo; si no, ruta actual */}
      <Routes location={state?.background || location}>
        {/* Ruta de login - no protegida */}
        <Route path="/login" element={<Login />} />
        
        {/* Rutas protegidas */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/patients" element={
          <ProtectedRoute>
            <Layout><Patients /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/patients/:id" element={
          <ProtectedRoute>
            <Layout><PatientDetail /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/patients/new" element={
          <ProtectedRoute>
            <Layout><NewPatient /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/patients/:id/edit" element={
          <ProtectedRoute>
            <Layout><NewPatient /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/medical-records" element={
          <ProtectedRoute>
            <Layout><MedicalRecords /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/medical-records/new" element={
          <ProtectedRoute>
            <Layout><NewMedicalRecord /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/medical-records/:id" element={
          <ProtectedRoute>
            <Layout><MedicalRecordDetail /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/NuevosPacientes" element={
          <ProtectedRoute>
            <Layout><Patients /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/NuevosPacientes/new" element={
          <ProtectedRoute>
            <Layout><NewPaciente /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/appointments" element={
          <ProtectedRoute>
            <Layout><Appointments /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/appointments/new" element={
          <ProtectedRoute>
            <Layout><NewAppointmentForm /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/calendar" element={
          <ProtectedRoute>
            <Layout><Calendar /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/clinics/new" element={
          <ProtectedRoute>
            <Layout><NewClinicForm /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/ListaClinicas" element={
          <ProtectedRoute>
            <Layout><ListaClinicas /></Layout>
          </ProtectedRoute>
        } />
        <Route path="appointments/:id" element={
          <ProtectedRoute>
            <AppointmentDetail />
          </ProtectedRoute>
        } />
        <Route path="appointments/:id/edit" element={
          <ProtectedRoute>
            <AppointmentEdit />
          </ProtectedRoute>
        } />
        <Route path="odontograma" element={
          <ProtectedRoute>
            <OdontogramPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Overlays modal cuando hay background */}
      {state?.background && (
        <Routes>
          {/* Pacientes: Detalle y Edición como modal */}
          <Route
            path="/patients/:id"
            element={
              <ProtectedRoute>
                <RouteModal title="Detalle de Paciente">
                  <PatientDetail />
                </RouteModal>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:id/edit"
            element={
              <ProtectedRoute>
                <RouteModal title="Editar Paciente">
                  <NewPatient />
                </RouteModal>
              </ProtectedRoute>
            }
          />

          {/* Citas: Detalle y Edición como modal */}
          <Route
            path="appointments/:id"
            element={
              <ProtectedRoute>
                <RouteModal title="Detalle de Cita">
                  <AppointmentDetail />
                </RouteModal>
              </ProtectedRoute>
            }
          />
          <Route
            path="appointments/:id/edit"
            element={
              <ProtectedRoute>
                <RouteModal title="Editar Cita">
                  <AppointmentEdit />
                </RouteModal>
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments/new"
            element={
              <ProtectedRoute>
                <RouteModal title="Nueva Cita">
                  <NewAppointmentForm />
                </RouteModal>
              </ProtectedRoute>
            }
          />

          {/* Historias Clínicas: creación como modal */}
          <Route
            path="/medical-records/new"
            element={
              <ProtectedRoute>
                <RouteModal title="Abrir/Crear Historia Clínica">
                  <NewMedicalRecord />
                </RouteModal>
              </ProtectedRoute>
            }
          />
          {/* Historias Clínicas: detalle/edición como modal */}
          <Route
            path="/medical-records/:id"
            element={
              <ProtectedRoute>
                <RouteModal title="Historia Clínica">
                  <MedicalRecordDetail />
                </RouteModal>
              </ProtectedRoute>
            }
          />

          {/* Pacientes: creación como modal */}
          <Route
            path="/patients/new"
            element={
              <ProtectedRoute>
                <RouteModal title="Nuevo Paciente">
                  <NewPatient />
                </RouteModal>
              </ProtectedRoute>
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

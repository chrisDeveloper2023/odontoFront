// src/App.tsx
import { useEffect, useMemo, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet } from "react-router-dom";
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
import UsersPage from "./pages/Users";
import PaymentsPage from "./pages/Payments";
import { setTenant, setAuthToken } from "@/api/client";
import { initTenant } from "@/lib/tenant";
import LoginPage from "./pages/Login";
import { AuthProvider, useAuth, useIsAuthenticated } from "@/context/AuthContext";
import { loadStoredAuth, clearAuth } from "@/lib/auth";
import { addUnauthorizedHandler } from "@/lib/auth-events";

const queryClient = new QueryClient();

initTenant();

function useBootTenant() {
  useEffect(() => {
    try {
      const slug = localStorage.getItem("tenantSlug") || "default";
      setTenant(slug);
    } catch {
      /* noop */
    }
  }, []);
}

function RequireAuth() {
  const { session } = useAuth();
  const isAuthenticated = useIsAuthenticated(session);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function AppRoutes() {
  const location = useLocation();
  const state = location.state as { background?: Location } | undefined;

  return (
    <>
      <Routes location={state?.background || location}>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
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
          <Route path="/clinics" element={<Layout><ListaClinicas /></Layout>} />
          <Route path="/clinics/new" element={<Layout><NewClinicForm /></Layout>} />
          <Route path="/clinics/:id/edit" element={<Layout><NewClinicForm /></Layout>} />
          <Route path="/users" element={<Layout><UsersPage /></Layout>} />
          <Route path="/payments" element={<Layout><PaymentsPage /></Layout>} />
          <Route path="/ListaClinicas" element={<Navigate to="/clinics" replace />} />
          <Route path="appointments/:id" element={<AppointmentDetail />} />
          <Route path="appointments/:id/edit" element={<AppointmentEdit />} />
          <Route path="odontograma" element={<OdontogramPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>

      {state?.background && (
        <Routes>
          <Route element={<RequireAuth />}>
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
            <Route
              path="/medical-records/new"
              element={
                <RouteModal title="Abrir/Crear Historia Clinica">
                  <NewMedicalRecord />
                </RouteModal>
              }
            />
            <Route
              path="/medical-records/:id"
              element={
                <RouteModal title="Historia Clinica">
                  <MedicalRecordDetail />
                </RouteModal>
              }
            />
            <Route
              path="/patients/new"
              element={
                <RouteModal title="Nuevo Paciente">
                  <NewPatient />
                </RouteModal>
              }
            />
          </Route>
        </Routes>
      )}
    </>
  );
}

const App = () => {
  useBootTenant();
  const [session, setSessionState] = useState(() => loadStoredAuth());

  useEffect(() => {
    if (!session) return;
    if (session.expiresAt && session.expiresAt <= Date.now()) {
      setSessionState(null);
      clearAuth();
    }
  }, [session]);

  useEffect(() => {
    setAuthToken(session?.token ?? null);
  }, [session?.token]);

  useEffect(() => {
    const removeHandler = addUnauthorizedHandler(() => {
      setSessionState(null);
      clearAuth();
    });
    return removeHandler;
  }, []);

  const authValue = useMemo(() => ({
    session,
    setSession: (next: typeof session) => {
      setSessionState(next);
      if (!next) {
        clearAuth();
      }
    },
    logout: () => {
      clearAuth();
      setSessionState(null);
    },
  }), [session]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider value={authValue}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;






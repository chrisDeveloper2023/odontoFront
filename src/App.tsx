// src/App.tsx
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet, matchPath } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientDetail from "./pages/PatientDetail";
import NewPatient from "./pages/NewPatient";
import MedicalRecords from "./pages/MedicalRecords";
import MedicalRecordDetail from "./pages/MedicalRecordDetail";
import NewMedicalRecordRoute from "./pages/NewMedicalRecordRoute";
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
import TreatmentsPage from "./pages/Treatments";
import NotificationsPage from "@/modules/notifications/pages/NotificationsPage";
import TenantsAdmin from "./pages/TenantsAdmin";
import { setTenant } from "@/api/client";
import { initTenant } from "@/lib/tenant";
import LoginPage from "./pages/Login";
import { AuthProvider, useAuth, useIsAuthenticated } from "@/context/AuthContext";
import ProtectedRoute from "@/routes/ProtectedRoute";

const queryClient = new QueryClient();

initTenant();

function useBootTenant() {
  useEffect(() => {
    try {
      const tenantId = localStorage.getItem("tenantId");
      if (tenantId) {
        setTenant(tenantId);
      }
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
  const background =
    state?.background && state.background.pathname !== location.pathname
      ? state.background
      : undefined;
  const modalMatches = ["/medical-records/new", "/medical-records/:id"];
  const isModalLocation = modalMatches.some((path) => matchPath(path, location.pathname));

  return (
    <>
      <Routes location={background || location}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/tenants" element={<TenantsAdmin />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/patients" element={<Layout><ProtectedRoute requiredPermissions="patients:view"><Patients /></ProtectedRoute></Layout>} />
          <Route path="/patients/:id" element={<Layout><PatientDetail /></Layout>} />
          <Route path="/patients/new" element={<Layout><ProtectedRoute requiredPermissions="patients:create"><NewPatient /></ProtectedRoute></Layout>} />
          <Route path="/patients/:id/edit" element={<Layout><ProtectedRoute requiredPermissions={['patients:edit', 'patients:update']}><NewPatient /></ProtectedRoute></Layout>} />
          <Route path="/medical-records" element={<Layout><ProtectedRoute requiredPermissions="medical-records:view"><MedicalRecords /></ProtectedRoute></Layout>} />
          <Route path="/medical-records/new" element={<Layout><ProtectedRoute requiredPermissions="medical-records:view"><MedicalRecords /></ProtectedRoute></Layout>} />
          <Route path="/medical-records/:id" element={<Layout><ProtectedRoute requiredPermissions="medical-records:view"><MedicalRecords /></ProtectedRoute></Layout>} />
          <Route path="/NuevosPacientes" element={<Layout><Patients /></Layout>} />
          <Route path="/NuevosPacientes/new" element={<Layout><NewPaciente /></Layout>} />
          <Route path="/appointments" element={<Layout><ProtectedRoute requiredPermissions="appointments:view"><Appointments /></ProtectedRoute></Layout>} />
          <Route path="/appointments/new" element={<Layout><ProtectedRoute requiredPermissions="appointments:create"><NewAppointmentForm /></ProtectedRoute></Layout>} />
          <Route path="/calendar" element={<Layout><ProtectedRoute requiredPermissions="calendar:view"><CalendarPage /></ProtectedRoute></Layout>} />
          <Route path="/clinics" element={<Layout><ProtectedRoute requiredPermissions="clinics:view"><ListaClinicas /></ProtectedRoute></Layout>} />
          <Route path="/clinics/new" element={<Layout><ProtectedRoute requiredPermissions="clinics:create"><NewClinicForm /></ProtectedRoute></Layout>} />
          <Route path="/clinics/:id/edit" element={<Layout><ProtectedRoute requiredPermissions={['clinics:edit', 'clinics:update']}><NewClinicForm /></ProtectedRoute></Layout>} />
          <Route path="/users" element={<Layout><ProtectedRoute requiredPermissions="users:view"><UsersPage /></ProtectedRoute></Layout>} />
          <Route path="/admin/tenants" element={<Layout><TenantsAdmin /></Layout>} />
          <Route path="/payments" element={<Layout><ProtectedRoute requiredPermissions="payments:view"><PaymentsPage /></ProtectedRoute></Layout>} />
          <Route path="/treatments" element={<Layout><ProtectedRoute requiredPermissions="treatments:view"><TreatmentsPage /></ProtectedRoute></Layout>} />
          <Route
            path="/notificaciones"
            element={
              <Layout>
                <ProtectedRoute requiredPermissions={["NOTIFICACIONES_VER", "notifications:view"]}>
                  <NotificationsPage />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route path="/ListaClinicas" element={<Navigate to="/clinics" replace />} />
          <Route path="appointments/:id" element={<AppointmentDetail />} />
          <Route path="appointments/:id/edit" element={<AppointmentEdit />} />
          <Route path="odontograma" element={<OdontogramPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>

      {(background || isModalLocation) && (
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
                <ProtectedRoute requiredPermissions="medical-records:create">
                  <NewMedicalRecordRoute />
                </ProtectedRoute>
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

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;




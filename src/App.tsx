// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import NewPatient from "./pages/NewPatient";
import MedicalRecords from "./pages/MedicalRecords";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/patients" element={<Layout><Patients /></Layout>} />
          <Route path="/patients/new" element={<Layout><NewPatient /></Layout>} />
          <Route path="/medical-records" element={<Layout><MedicalRecords /></Layout>} />
          <Route path="/medical-records/new" element={<Layout><NewMedicalRecord /></Layout>} />
          <Route path="/NuevosPacientes" element={<Layout><Patients /></Layout>} />
          <Route path="/NuevosPacientes/new" element={<Layout><NewPaciente /></Layout>} />
          <Route path="/appointments" element={<Layout><Appointments /></Layout>} />
          <Route path="/appointments/new" element={<Layout><NewAppointmentForm /></Layout>} />
          <Route path="/clinics/new" element={<Layout><NewClinicForm /></Layout>} />
          <Route path="/ListaClinicas" element={<Layout><ListaClinicas /></Layout>} />
          <Route path="appointments/:id" element={<AppointmentDetail />} />
          <Route path="appointments/:id/edit" element={<AppointmentEdit />} />
          <Route path="odontograma" element={<OdontogramPage />} />
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

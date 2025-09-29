import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, Calendar, CalendarDays, TrendingUp, Plus, Activity, Building2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatGuayaquilDateISO } from "@/lib/timezone";
import { apiGet } from "@/api/client";
import ClinicsTable from "@/components/ClinicsTable";
import { useClinicas } from "@/servicios/clinicas";

type RawPaciente = {
  id_paciente: number;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  fecha_creacion: string;
  telefono: string;
  correo: string;
  activo: boolean;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [totalPatients, setTotalPatients] = useState(0);
  const [newThisMonth, setNewThisMonth] = useState(0);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientError, setPatientError] = useState<string | null>(null);

  const {
    clinics,
    loading: clinicsLoading,
    error: clinicsError,
    refetch: refetchClinics,
    total: totalClinics,
    activeCount: activeClinics,
  } = useClinicas();

  useEffect(() => {
    async function fetchStats() {
      try {
        const json = await apiGet<{ data: RawPaciente[]; total?: number }>("/pacientes", {
          page: 1,
          limit: 1000,
        });
        const list = Array.isArray(json.data) ? json.data : [];
        setTotalPatients(json.total ?? list.length);

        const todayParts = formatGuayaquilDateISO(new Date()).split("-");
        const currentYear = Number(todayParts[0] ?? 0);
        const currentMonth = Number(todayParts[1] ?? 0);
        const monthCount = list.filter((p) => {
          const dateStr = formatGuayaquilDateISO(p.fecha_creacion);
          if (!dateStr) return false;
          const [yearStr, monthStr] = dateStr.split("-");
          return Number(yearStr) === currentYear && Number(monthStr) === currentMonth;
        }).length;
        setNewThisMonth(monthCount);
      } catch (err) {
        console.error(err);
        setPatientError(err instanceof Error ? err.message : "No se pudieron cargar las estadisticas");
      } finally {
        setLoadingPatients(false);
      }
    }
    fetchStats();
  }, []);

  if (loadingPatients) {
    return <div className="p-4">Cargando estadisticas...</div>;
  }

  if (patientError) {
    return <div className="p-4 text-red-600">Error: {patientError}</div>;
  }

  const stats = [
    {
      title: "Total pacientes",
      value: String(totalPatients),
      change: `+${newThisMonth} este mes`,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Historias clinicas",
      value: "342",
      change: "+18 esta semana",
      icon: FileText,
      color: "text-green-600",
    },
    {
      title: "Clinicas activas",
      value: String(activeClinics),
      change: `${totalClinics} registradas`,
      icon: Building2,
      color: "text-sky-600",
    },
    {
      title: "Citas programadas",
      value: "24",
      change: "Para hoy",
      icon: Activity,
      color: "text-purple-600",
    },
  ];

  const recentActivities = [
    { patient: "Maria Gonzalez", action: "Nueva historia clinica creada", time: "Hace 2 horas" },
    { patient: "Carlos Rodriguez", action: "Cita medica completada", time: "Hace 3 horas" },
    { patient: "Ana Martinez", action: "Examenes medicos actualizados", time: "Hace 5 horas" },
    { patient: "Juan Perez", action: "Nuevo paciente registrado", time: "Hace 1 dia" },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-primary to-accent rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Bienvenido a ClinicSoft</h1>
        <p className="text-lg opacity-90">Sistema integral de gestion de historias clinicas y pacientes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Acciones rapidas
            </CardTitle>
            <CardDescription>Accesos directos a las funciones mas utilizadas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/patients/new" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Registrar nuevo paciente
              </Button>
            </Link>
            <Link to="/medical-records/new" className="block">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Crear historia clinica
              </Button>
            </Link>
            <Link to="/appointments/new" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Programar cita
              </Button>
            </Link>
            <Link to="/calendar" className="block">
              <Button variant="outline" className="w-full justify-start">
                <CalendarDays className="h-4 w-4 mr-2" />
                Ver calendario
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/clinics")}> 
              <Building2 className="h-4 w-4 mr-2" />
              Gestionar clinicas
            </Button>
            <Link to="/patients" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Ver todos los pacientes
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Actividad reciente
            </CardTitle>
            <CardDescription>Ultimas acciones realizadas en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 pb-3 border-b last:border-b-0">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.patient}</p>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <ClinicsTable
        clinics={clinics}
        onCreate={() => navigate("/clinics?action=new")}
        loading={clinicsLoading}
        error={clinicsError}
        onRetry={refetchClinics}
        onViewAll={() => navigate("/clinics")}
        showCreateButton
        showViewAllButton
        showActions={false}
        limit={5}
        compact
      />
    </div>
  );
};

export default Dashboard;






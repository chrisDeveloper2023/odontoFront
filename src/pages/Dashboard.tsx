// src/pages/Dashboard.tsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, Calendar, TrendingUp, Plus, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import ListaClinicas from "./ListaClinicas";

interface RawPaciente {
  id_paciente: number;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  fecha_creacion: string;
  telefono: string;
  correo: string;
  activo: boolean;
}

const Dashboard = () => {
  const [totalPatients, setTotalPatients] = useState(0);
  const [newThisMonth, setNewThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Obtener todos los pacientes con límite alto para evitar paginación por defecto
        const res = await fetch(`${import.meta.env.VITE_API_URL}/pacientes?page=1&limit=1000`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        // Extraer array de datos
        const list: RawPaciente[] = Array.isArray(json.data) ? json.data : [];
        // Total real de pacientes
        setTotalPatients(json.total ?? list.length);
        // Calcular cuántos pacientes se crearon este mes (usando fecha_nacimiento como indicador)
        const now = new Date();
        const monthCount = list.filter(p => {
          const d = new Date(p.fecha_creacion);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;
        setNewThisMonth(monthCount);
      } catch (err) {
        console.error(err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <div className="p-4">Cargando estadísticas…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  // Conservar estructura original de stats, pero con datos dinámicos en el primero
  const stats = [
    {
      title: "Total Pacientes",
      value: String(totalPatients),
      change: `+${newThisMonth} este mes`,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Historias Clínicas",
      value: "342",
      change: "+18 esta semana",
      icon: FileText,
      color: "text-green-600",
    },
    {
      title: "Citas Programadas",
      value: "24",
      change: "Para hoy",
      icon: Calendar,
      color: "text-orange-600",
    },
    {
      title: "Consultas Activas",
      value: "8",
      change: "En curso",
      icon: Activity,
      color: "text-purple-600",
    },
  ];

  const recentActivities = [
    {
      patient: "María González",
      action: "Nueva historia clínica creada",
      time: "Hace 2 horas",
    },
    {
      patient: "Carlos Rodríguez",
      action: "Cita médica completada",
      time: "Hace 3 horas",
    },
    {
      patient: "Ana Martínez",
      action: "Exámenes médicos actualizados",
      time: "Hace 5 horas",
    },
    {
      patient: "Juan Pérez",
      action: "Nuevo paciente registrado",
      time: "Hace 1 día",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-accent rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Bienvenido a ClinicSoft</h1>
        <p className="text-lg opacity-90">
          Sistema integral de gestión de historias clínicas y pacientes
        </p>
      </div>

      {/* Stats Grid */}
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

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Acciones Rápidas
            </CardTitle>
            <CardDescription>
              Accesos directos a las funciones más utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/patients/new" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Registrar Nuevo Paciente
              </Button>
            </Link>
            <Link to="/medical-records/new" className="block">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Crear Historia Clínica
              </Button>
            </Link>
            <Link to="/appointments/new" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Programar Cita
              </Button>
            </Link>
            <Link to="/ListadoClinicas/new" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Clinicas
              </Button>
            </Link>
            <Link to="/patients" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Ver Todos los Pacientes
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>
              Últimas acciones realizadas en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 pb-3 border-b last:border-b-0">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
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
      <div>Aqui la lista
        <div className="App">
          <h1>Bienvenido</h1>
          <ListaClinicas />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

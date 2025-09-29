import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Users, FileText, Calendar, CalendarDays, Plus, LogOut, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import TenantSelector from "@/components/TenantSelector";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { session, logout } = useAuth();

  const fullName = session ? `${session.usuario.nombres} ${session.usuario.apellidos}`.trim() : "Invitado";
  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2) || "US";
  const tenantLabel = session?.usuario.tenantSlug || "Sin tenant";
  const email = session?.usuario.correo ?? "";
  const rolesLabel = session?.usuario.roles?.length ? session.usuario.roles.join(", ") : null;

  const navigation = [
    { name: "Dashboard", href: "/", icon: Heart },
    { name: "Pacientes", href: "/patients", icon: Users },
    { name: "Historias Clinicas", href: "/medical-records", icon: FileText },
    { name: "Clinicas", href: "/clinics", icon: Building2 },
    { name: "Citas", href: "/appointments", icon: Calendar },
    { name: "Calendario", href: "/calendar", icon: CalendarDays },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-2 rounded-lg">
                <Heart className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">ClinicSoft</h1>
                <p className="text-sm text-muted-foreground">Sistema de Historias Clinicas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TenantSelector />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden items-center gap-2 px-2 py-1.5 sm:flex">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col text-left leading-tight">
                      <span className="text-sm font-medium">{fullName}</span>
                      <span className="text-xs text-muted-foreground">{tenantLabel}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{fullName}</span>
                      {email ? (
                        <span className="text-xs text-muted-foreground">{email}</span>
                      ) : null}
                    </div>
                  </DropdownMenuLabel>
                  {rolesLabel ? (
                    <DropdownMenuLabel className="pt-0 text-xs font-normal text-muted-foreground">
                      {rolesLabel}
                    </DropdownMenuLabel>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      logout();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2 py-1.5 sm:hidden">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{fullName}</span>
                      {email ? (
                        <span className="text-xs text-muted-foreground">{email}</span>
                      ) : null}
                    </div>
                  </DropdownMenuLabel>
                  {tenantLabel ? (
                    <DropdownMenuLabel className="pt-0 text-xs font-normal text-muted-foreground">
                      Tenant: {tenantLabel}
                    </DropdownMenuLabel>
                  ) : null}
                  {rolesLabel ? (
                    <DropdownMenuLabel className="pt-0 text-xs font-normal text-muted-foreground">
                      {rolesLabel}
                    </DropdownMenuLabel>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      logout();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Link to="/patients/new">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Paciente
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-medical-light border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors",
                    location.pathname === item.href
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                  )}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;










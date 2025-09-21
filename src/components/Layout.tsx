import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, FileText, Calendar, Plus, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import AnimatedToothImage from "./AnimatedToothImage";
import { authService } from "@/services/auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getUser();

  const navigation = [
    { name: "Dashboard", href: "/", icon: AnimatedToothImage },
    { name: "Pacientes", href: "/patients", icon: Users },
    { name: "Historias Clínicas", href: "/medical-records", icon: FileText },
    { name: "Citas", href: "/appointments", icon: Calendar },
    { name: "Calendario", href: "/calendar", icon: Calendar },
  ];

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-2 rounded-lg">
              <AnimatedToothImage className="h-6 w-6 text-primary-foreground animate-heartbeat" />
              </div>
              <div>
              <h1 className="text-xl font-bold animate-text-wave">ClinicSoft</h1>
              <p className="text-sm text-muted-foreground">Sistema de Historias Clínicas</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/patients/new">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Paciente
                </Button>
              </Link>
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user?.nombreCompleto?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-medium">{user?.nombreCompleto || 'Usuario'}</p>
                      <p className="text-xs text-muted-foreground">{user?.nombreUsuario || ''}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
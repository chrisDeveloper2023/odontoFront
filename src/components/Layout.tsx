import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bell, Heart, Users, FileText, Calendar, CalendarDays, Plus, LogOut, Building2, Wallet, Shield, ChevronDown } from "lucide-react";
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
import { NotificationProvider } from "@/modules/notifications/context/NotificationContext";
import { NotificationBell } from "@/modules/notifications/components/NotificationBell";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

// Interfaces para la configuraciÃ³n del menÃº
interface MenuItem {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  isActive?: boolean;
  hasSubmenu?: boolean;
  submenu?: SubMenuItem[];
  permissions?: string[];
  roles?: string[];
  visible?: boolean;
}

interface SubMenuItem {
  id: string;
  name: string;
  href: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  permissions?: string[];
  roles?: string[];
  visible?: boolean;
}

interface UserMenuConfig {
  profile: {
    showAvatar: boolean;
    showName: boolean;
    showEmail: boolean;
    showTenant: boolean;
    showRoles: boolean;
  };
  actions: {
    logout: {
      enabled: boolean;
      icon: React.ComponentType<{ className?: string }>;
      label: string;
    };
  };
}

// Clase de configuraciÃ³n del menÃº
class MenuConfig {
  private static instance: MenuConfig;
  private menuItems: MenuItem[] = [];
  private userMenuConfig: UserMenuConfig;

  private constructor() {
    this.initializeMenuItems();
    this.initializeUserMenuConfig();
  }

  public static getInstance(): MenuConfig {
    if (!MenuConfig.instance) {
      MenuConfig.instance = new MenuConfig();
    }
    return MenuConfig.instance;
  }

  private initializeMenuItems(): void {
    this.menuItems = [
      {
        id: "dashboard",
        name: "Dashboard",
        href: "/",
        icon: Heart,
        description: "Panel principal del sistema",
        permissions: ["dashboard:view"],
        roles: ["admin", "doctor", "recepcionista"],
        visible: true
      },
      {
        id: "patients",
        name: "Pacientes",
        href: "/patients",
        icon: Users,
        description: "GestiÃ³n de pacientes",
        permissions: ["patients:view", "patients:create", "patients:edit"],
        roles: ["admin", "doctor", "recepcionista"],
        visible: true
      },
      {
        id: "medical-records",
        name: "Historias Clinicas",
        href: "/medical-records",
        icon: FileText,
        description: "GestiÃ³n de historias clÃ­nicas",
        permissions: ["medical-records:view", "medical-records:create", "medical-records:edit"],
        roles: ["admin", "doctor"],
        visible: true
      },
      {
        id: "payments",
        name: "Pagos",
        href: "/payments",
        icon: Wallet,
        description: "GestiÃ³n de pagos y facturaciÃ³n",
        permissions: ["payments:view", "payments:create", "payments:edit"],
        roles: ["admin", "recepcionista"],
        visible: true
      },
      {
        id: "appointments",
        name: "Citas",
        href: "/appointments",
        icon: Calendar,
        description: "GestiÃ³n de citas mÃ©dicas",
        permissions: ["appointments:view", "appointments:create", "appointments:edit"],
        roles: ["admin", "doctor", "recepcionista"],
        visible: true
      },
      {
        id: "calendar",
        name: "Calendario",
        href: "/calendar",
        icon: CalendarDays,
        description: "Vista de calendario de citas",
        permissions: ["calendar:view"],
        roles: ["admin", "doctor", "recepcionista"],
        visible: true
      },
      {
        id: "notifications",
        name: "Notificaciones",
        href: "/notificaciones",
        icon: Bell,
        description: "Centro de notificaciones y alertas",
        permissions: ["NOTIFICACIONES_VER"],
        roles: ["admin", "doctor", "recepcionista"],
        visible: true
      },
      {
        id: "admin",
        name: "Administrar",
        href: "#",
        icon: Shield,
        description: "Herramientas de administraciÃ³n",
        hasSubmenu: true,
        permissions: ["admin:access"],
        roles: ["admin"],
        visible: true,
        submenu: [
          {
            id: "users-management",
            name: "GestiÃ³n de usuarios",
            href: "/users",
            description: "Administrar usuarios del sistema",
            icon: Users,
            permissions: ["users:view", "users:create", "users:edit", "users:delete"],
            roles: ["admin"],
            visible: true
          },
          {
            id: "clinics-management",
            name: "GestiÃ³n de clÃ­nicas",
            href: "/clinics",
            description: "Administrar clÃ­nicas",
            icon: Building2,
            permissions: ["clinics:view", "clinics:create", "clinics:edit", "clinics:delete"],
            roles: ["admin"],
            visible: true
          }
        ]
      }
    ];
  }

  private initializeUserMenuConfig(): void {
    this.userMenuConfig = {
      profile: {
        showAvatar: true,
        showName: true,
        showEmail: true,
        showTenant: true,
        showRoles: true
      },
      actions: {
        logout: {
          enabled: true,
          icon: LogOut,
          label: "Cerrar sesiÃ³n"
        }
      }
    };
  }

  public getMenuItems(): MenuItem[] {
    return this.menuItems;
  }

  public getMenuItemById(id: string): MenuItem | undefined {
    return this.menuItems.find(item => item.id === id);
  }

  public getSubmenuItems(parentId: string): SubMenuItem[] {
    const parentItem = this.getMenuItemById(parentId);
    return parentItem?.submenu || [];
  }

  public getUserMenuConfig(): UserMenuConfig {
    return this.userMenuConfig;
  }

  public getMenuItemsByRole(role: string): MenuItem[] {
    return this.menuItems.filter(item => 
      !item.roles || item.roles.includes(role)
    );
  }

  public getMenuItemsByPermission(permission: string): MenuItem[] {
    return this.menuItems.filter(item => 
      !item.permissions || item.permissions.includes(permission)
    );
  }

  public getVisibleMenuItems(): MenuItem[] {
    return this.menuItems.filter(item => item.visible !== false);
  }

  public getVisibleMenuItemsByRole(role: string): MenuItem[] {
    return this.menuItems.filter(item => 
      item.visible !== false && (!item.roles || item.roles.includes(role))
    );
  }

  public getVisibleMenuItemsByPermission(permission: string): MenuItem[] {
    return this.menuItems.filter(item => 
      item.visible !== false && (!item.permissions || item.permissions.includes(permission))
    );
  }

  public setMenuItemVisibility(id: string, visible: boolean): void {
    const index = this.menuItems.findIndex(item => item.id === id);
    if (index !== -1) {
      this.menuItems[index].visible = visible;
    }
  }

  public setSubmenuItemVisibility(parentId: string, submenuId: string, visible: boolean): void {
    const parentItem = this.getMenuItemById(parentId);
    if (parentItem?.submenu) {
      const submenuIndex = parentItem.submenu.findIndex(item => item.id === submenuId);
      if (submenuIndex !== -1) {
        parentItem.submenu[submenuIndex].visible = visible;
      }
    }
  }

  public toggleMenuItemVisibility(id: string): void {
    const item = this.getMenuItemById(id);
    if (item) {
      item.visible = !item.visible;
    }
  }

  public addMenuItem(item: MenuItem): void {
    this.menuItems.push(item);
  }

  public updateMenuItem(id: string, updates: Partial<MenuItem>): void {
    const index = this.menuItems.findIndex(item => item.id === id);
    if (index !== -1) {
      this.menuItems[index] = { ...this.menuItems[index], ...updates };
    }
  }

  public removeMenuItem(id: string): void {
    this.menuItems = this.menuItems.filter(item => item.id !== id);
  }
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, logout, hasPermission } = useAuth();
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  // Obtener configuraciÃ³n del menÃº
  const menuConfig = MenuConfig.getInstance();
  const userMenuConfig = menuConfig.getUserMenuConfig();
  
  // Filtrar menÃºs por permisos
  const can = (needed?: string[]) => !needed?.length || hasPermission(needed ?? []);

  const navigation = menuConfig
    .getMenuItems()
    .filter((item) => item.visible !== false && can(item.permissions))
    .map((item) =>
      item.hasSubmenu
        ? { ...item, submenu: item.submenu?.filter((sub) => can(sub.permissions)) }
        : item
    )
    .filter((item) => !item.hasSubmenu || (item.submenu && item.submenu.length > 0));

  const fullName = session ? `${session.usuario.nombres} ${session.usuario.apellidos}`.trim() : "Invitado";
  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2) || "US";
  const tenantLabel = session?.usuario.tenant?.nombre || session?.usuario.tenantSlug || "Sin tenant";
  const email = session?.usuario.correo ?? "";
  const roleNames = Array.from(
    new Set(
      [
        session?.usuario.rol?.nombre_rol,
        ...(session?.usuario.roles ?? []),
      ]
        .filter(Boolean)
        .map((name) => String(name))
    )
  );
  const rolesLabel = roleNames.length ? roleNames.join(", ") : null;

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="bg-primary p-2 rounded-lg animate-pulse-glow">
                  <Heart className="h-6 w-6 text-primary-foreground animate-float" />
                </div>
                <div>
                  <h1 className="text-xl font-bold relative overflow-hidden">
                    <span className="relative z-10 flex">
                      {['C', 'l', 'i', 'n', 'i', 'c', 'S', 'o', 'f', 't'].map((letter, index) => (
                        <span key={index} className="animate-letter-wave">
                          {letter}
                        </span>
                      ))}
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer"></span>
                  </h1>
                  <p className="text-sm text-muted-foreground">Sistema de Historias Clinicas</p>
                </div>
              </div>
            <div className="flex items-center gap-3">
              <TenantSelector />
              <NotificationBell onClick={() => navigate("/notificaciones")} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden items-center gap-2 px-2 py-1.5 sm:flex">
                    {userMenuConfig.profile.showAvatar && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex flex-col text-left leading-tight">
                      {userMenuConfig.profile.showName && (
                        <span className="text-sm font-medium">{fullName}</span>
                      )}
                      {userMenuConfig.profile.showTenant && (
                        <span className="text-xs text-muted-foreground">{tenantLabel}</span>
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      {userMenuConfig.profile.showName && (
                        <span className="text-sm font-semibold">{fullName}</span>
                      )}
                      {userMenuConfig.profile.showEmail && email && (
                        <span className="text-xs text-muted-foreground">{email}</span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  {userMenuConfig.profile.showRoles && rolesLabel && (
                    <DropdownMenuLabel className="pt-0 text-xs font-normal text-muted-foreground">
                      {rolesLabel}
                    </DropdownMenuLabel>
                  )}
                  <DropdownMenuSeparator />
                  {userMenuConfig.actions.logout.enabled && (
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        logout();
                      }}
                    >
                      <userMenuConfig.actions.logout.icon className="mr-2 h-4 w-4" />
                      {userMenuConfig.actions.logout.label}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2 py-1.5 sm:hidden">
                    {userMenuConfig.profile.showAvatar && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      {userMenuConfig.profile.showName && (
                        <span className="text-sm font-semibold">{fullName}</span>
                      )}
                      {userMenuConfig.profile.showEmail && email && (
                        <span className="text-xs text-muted-foreground">{email}</span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  {userMenuConfig.profile.showTenant && tenantLabel && (
                    <DropdownMenuLabel className="pt-0 text-xs font-normal text-muted-foreground">
                      Tenant: {tenantLabel}
                    </DropdownMenuLabel>
                  )}
                  {userMenuConfig.profile.showRoles && rolesLabel && (
                    <DropdownMenuLabel className="pt-0 text-xs font-normal text-muted-foreground">
                      {rolesLabel}
                    </DropdownMenuLabel>
                  )}
                  <DropdownMenuSeparator />
                  {userMenuConfig.actions.logout.enabled && (
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        logout();
                      }}
                    >
                      <userMenuConfig.actions.logout.icon className="mr-2 h-4 w-4" />
                      {userMenuConfig.actions.logout.label}
                    </DropdownMenuItem>
                  )}
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
              
              // Si tiene submenÃº, renderizar dropdown
              if (item.hasSubmenu) {
                const submenuItems = menuConfig.getSubmenuItems(item.id).filter(subItem => subItem.visible !== false);
                return (
                  <DropdownMenu key={item.id} open={isAdminMenuOpen} onOpenChange={setIsAdminMenuOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors h-auto",
                          submenuItems.some(subItem => location.pathname === subItem.href)
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                        )}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {item.name}
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuLabel>{item.description || "AdministraciÃ³n"}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {submenuItems.map((subItem) => (
                        <DropdownMenuItem key={subItem.id} asChild>
                          <Link
                            to={subItem.href}
                            className={cn(
                              "flex items-center w-full",
                              location.pathname === subItem.href && "bg-accent"
                            )}
                            title={subItem.description}
                          >
                            {subItem.icon && <subItem.icon className="h-4 w-4 mr-2" />}
                            {subItem.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
              
              // Renderizar enlace normal
              return (
                <Link
                  key={item.id}
                  to={item.href}
                  className={cn(
                    "flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors",
                    location.pathname === item.href
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                  )}
                  title={item.description}
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
    </NotificationProvider>
  );
};

export default Layout;




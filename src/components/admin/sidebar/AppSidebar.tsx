import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAppSelector } from "@/hooks/useUserData";
import { BarChart3, Home, Package } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import SideBarSkeleton from "./sideBarSkeleton";

export const MENU_ITEMS = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: BarChart3,
    roles: ["OWNER", "MANAGER", "EMPLOYEE"],
  },
  {
    title: "Stock",
    url: "/products",
    icon: Package,
    roles: ["OWNER", "MANAGER"],
  },
  {
    title: "Puntos de venta",
    url: "/stores",
    icon: Package,
    roles: ["OWNER"],
  },
  {
    title: "Personal",
    url: "/team-members",
    icon: Package,
    roles: ["OWNER", "MANAGER"],
  },
  // {
  //   title: 'Configuración',
  //   url: '/settings',
  //   icon: Settings,
  // },
];

export function AppSidebar() {
  const location = useLocation();

  const { role } = useAppSelector((state) => state.user);

  const userRoleMenuItems = MENU_ITEMS.filter((item) =>
    item.roles.includes(role)
  );

  if (!role) {
    return null;
  }

  if (role === "EMPLOYEE") {
    return null;
  }

  return (
    <Sidebar className="border-r border-sidebar-border bg-foreground">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Home className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">
              Mi Negocio
            </h2>
            <p className="text-sm text-sidebar-foreground/70">
              Gestión de inventario
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 font-medium">
            Navegación
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {!role && <SideBarSkeleton />}

              {userRoleMenuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`transition-all duration-200 ${
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <Link
                        to={item.url}
                        className="flex items-center gap-3 px-3 py-2"
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

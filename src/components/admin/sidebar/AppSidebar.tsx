import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useAppSelector } from "@/hooks/useUserData";
import { BarChart3, ChevronRight, Home, Package } from "lucide-react";
import { Link } from "react-router-dom";

/* eslint-disable react-refresh/only-export-components */
export const MENU_ITEMS = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: BarChart3,
    roles: ["OWNER", "MANAGER", "EMPLOYEE"],
  },
  {
    title: "Stock",
    url: "/stock",
    icon: Package,
    roles: ["OWNER", "MANAGER"],
  },
  {
    title: "Vacios",
    url: "/lot_containers",
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
    title: "Clientes",
    url: "/clients",
    icon: Package,
    roles: ["OWNER", "MANAGER"],
  },
  {
    title: "Personal",
    url: "/team-members",
    icon: Package,
    roles: ["OWNER", "MANAGER"],
  },
  {
    title: "Remitos",
    url: "/load-orders",
    icon: Package,
    roles: ["OWNER", "MANAGER"],
    subItems: [
      {
        title: "Tus Remitos",
        url: "/load-orders",
      },
      {
        title: "Agregar Remito",
        url: "/load-orders/add-load-order",
      },
    ],
  },
  // {
  //   title: "Configuración",
  //   url: "/settings",
  //   icon: Settings,
  // },
];

export function AppSidebar() {
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
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {userRoleMenuItems.map((item) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;
              if (!hasSubItems) {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <Link to={item.url}>
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }
              return (
                <Collapsible
                  key={item.title}
                  asChild
                  // defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.subItems?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <Link to={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

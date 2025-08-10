import { BarChart3, Package, Settings, Home } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar';

const menuItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: BarChart3,
  },
  {
    title: 'Productos / Categorías',
    url: '/products',
    icon: Package,
  },
   {
    title: 'Tiendas',
    url: '/stores',
    icon: Package,
  },
  {
    title: 'Configuración',
    url: '/settings',
    icon: Settings,
  },
];

export function AppSidebar() {
  const location = useLocation();

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
      
      <SidebarContent >
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 font-medium">
            Navegación
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      className={`transition-all duration-200 ${
                        isActive 
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                      }`}
                    >
                      <a href={item.url} className="flex items-center gap-3 px-3 py-2">
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </a>
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
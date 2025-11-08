import MarketStoreLogo from "@/assets/icons/MarketStoreIcon.png";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/hooks/useUserData";
import { BarChart3, ChevronRight, Home, Package, type LucideProps } from "lucide-react";
import type React from "react";
import { Link } from "react-router-dom";
import { CategorySelectorRoot, CreateCategory } from "../shared/selectors/categorySelector";
import { ClientSelectorRoot, CreateClient } from "../shared/selectors/clientSelector";
import { CreateProductPresentation, ProductPresentationSelectorRoot } from "../shared/selectors/productPresentationSelector";
import { CreateProvider, ProviderSelectorRoot } from "../shared/selectors/providersSelector";
import { CreatePurchasingAgent, PurchasingAgentSelectorRoot } from "../shared/selectors/purchasingAgentSelector";
import { CreateStockRoom, StockroomSelectorRoot } from "../shared/selectors/stockRoomSelector";
import { CreateSubCategory, SubCategorySelectorRoot } from "../shared/selectors/subCategorySelector";
import { CreateStore, StoreSelectorRoot } from "../shared/selectors/XXstoresSelector";

/* eslint-disable react-refresh/only-export-components */
export const MENU_ITEMS: {
  title: string;
  type?: "link" | "button" | '';
  url?: string;
  children?: React.ReactNode;
  icon?: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  roles: Array<"OWNER" | "MANAGER" | "EMPLOYEE">;
  subItems?: Array<{
    title: string; url?: string; type?: "link" | "button";
    children?: React.ReactNode;
  }>;
}[] = [
    {
      title: 'Precarga',
      type: "",
      roles: ["OWNER", "MANAGER"],
      icon: Home,
      subItems: [
        {
          title: "Categoría",
          type: "button",
          children: <CategorySelectorRoot disabled={false} value={null} onChange={() => { }}>
            <CreateCategory isShortCut={true} />
          </CategorySelectorRoot>
        },
        {
          title: "Cliente",
          type: "button",
          children: <ClientSelectorRoot value={null} onChange={() => { }}>
            <CreateClient isShortCut={true} />
          </ClientSelectorRoot>
          ,
        },
        {
          title: "Comprador",
          type: "button",
          children: <PurchasingAgentSelectorRoot value={null} onChange={() => { }}>
            <CreatePurchasingAgent isShortCut={true} />
          </PurchasingAgentSelectorRoot>
          ,
        },
        {
          title: "Depósito",
          type: "button",
          children: <StockroomSelectorRoot value={null} onChange={() => { }}>
            <CreateStockRoom isShortCut={true} />
          </StockroomSelectorRoot>
          ,
        },
        {
          title: "Marca",
          type: "button",
          children: <ProductPresentationSelectorRoot productId={null} disabled={false} value={null} onChange={() => { }}>
            <CreateProductPresentation isShortCut={true} />
          </ProductPresentationSelectorRoot>
        },
        {
          title: "Proveedor",
          type: "button",
          children: <ProviderSelectorRoot value={null} onChange={() => { }}>
            <CreateProvider isShortCut={true} />
          </ProviderSelectorRoot>
          ,
        },
        {
          title: "Subcategoría",
          type: "button",
          children: <SubCategorySelectorRoot value={null} onChange={() => { }}>
            <CreateSubCategory isShortCut={true} />
          </SubCategorySelectorRoot>
          ,
        },
        {
          title: "Tienda",
          type: "button",
          children: <StoreSelectorRoot value={null} onChange={() => { }}>
            <CreateStore isShortCut={true} />
          </StoreSelectorRoot>
          ,
        },
        // {
        //   title: "Artículo",
        //   type: "button",
        //   children: <Button onClick={() => {
        //     alert('crear articulo')
        //   }}>Agregar Artículo</Button>,
        // },
      ],
    },
    {
      title: "Dashboard",
      type: "link",
      url: "/dashboard",
      children: null,
      icon: BarChart3,
      roles: ["OWNER", "MANAGER", "EMPLOYEE"]
    },
    {
      title: "Stock",
      type: "link",
      url: "/stock",
      icon: Package,
      roles: ["OWNER", "MANAGER"],
    },
    {
      title: "Vacios",
      type: "link",
      url: "/lot_containers",
      icon: Package,
      roles: ["OWNER", "MANAGER"],
    },
    {
      title: "Puntos de venta",
      type: "link",
      url: "/stores",
      icon: Package,
      roles: ["OWNER"],
    },
    {
      title: "Clientes",
      type: "link",
      url: "/clients",
      icon: Package,
      roles: ["OWNER", "MANAGER"],
    },
    {
      title: "Ordenes de transferencia",
      type: "link",
      url: "/transfer-orders",
      icon: Package,
      roles: ["OWNER", "MANAGER"],
    },
    {
      title: "Personal",
      type: "link",
      url: "/team-members",
      icon: Package,
      roles: ["OWNER", "MANAGER"],
    },
    {
      title: "Remitos",
      type: "link",
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
    item.roles.includes(role as "OWNER" | "MANAGER" | "EMPLOYEE")
  );

  if (!role) {
    return <Skeleton className="w-64 h-full" />;
  }

  if (role === "EMPLOYEE") {
    return null;
  }

  return (
    <Sidebar className="border-r border-sidebar-border bg-foreground">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <img src={MarketStoreLogo} className="text-primary-foreground rounded-lg w-full h-full" alt="logo" />

          </div>
          <div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">
              Market Store
            </h2>
            <p className="text-sm text-sidebar-foreground/70">
              Gestión de tu negocio
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Accesos Rápidos</SidebarGroupLabel>
          <SidebarMenu>
            {userRoleMenuItems.map((item) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;
              if (!hasSubItems) {
                const isItemLink = item.type === "link";
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      {isItemLink ? <Link to={item?.url || '#'}>
                        <span>{item.title}</span>
                      </Link> : <span>{item.title}</span>}

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
                        {item.subItems?.map((subItem) => {
                          const isSubItemLink = subItem.type === "link";
                          const isSubItemBtn = subItem.type === "button";
                          if (isSubItemBtn) {
                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton>
                                  {subItem.children}
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            )
                          }
                          if (!isSubItemLink) {
                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
                                  <Link to={subItem.url || '#'}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            )
                          }

                          return <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton>
                              {subItem.title}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>;
                        })}
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

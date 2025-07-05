import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { useLocation } from "react-router-dom";
import { PUBLIC_ROUTES } from "@/App";

interface LayoutProps {
  children: React.ReactNode;
}



export const Layout = ({ children }: LayoutProps) => {
  const pathName = useLocation().pathname;
  const isInPublicRoute = PUBLIC_ROUTES.includes(pathName);

  if (isInPublicRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <main className="overflow-auto">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="overflow-auto">
            <div className="animate-fade-in">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

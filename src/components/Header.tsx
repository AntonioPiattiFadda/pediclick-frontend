import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { signOut } from "@/service/auth";
import { useMutation } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import StoresSelector from "./admin/stores/StoresSelector";

export const Header = () => {
  const signOutMutation = useMutation({
    mutationFn: async () => {
      return await signOut();
    },
    onSuccess: () => {
      window.location.href = "/sign-in"; 
    },
  });

  return (
    <header className="border-b border-border bg-card shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-6 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <div className="hidden md:block">
            <h1 className="text-xl font-semibold text-foreground">
              Panel de Control
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestiona tu inventario y ventas
            </p>
          </div>
        </div>

        <StoresSelector />

        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-foreground">Juan Pérez</p>
            <p className="text-xs text-muted-foreground">Administrador</p>
          </div>

          <Avatar className="w-8 h-8">
            <AvatarImage src="/api/placeholder/32/32" alt="Usuario" />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              JP
            </AvatarFallback>
          </Avatar>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOutMutation.mutate()}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline ml-2">Salir</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

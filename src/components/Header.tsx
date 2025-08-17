import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAppSelector } from "@/hooks/useUserData";
import { signOut } from "@/service/auth";
import { getUserDataByUid } from "@/service/profiles";
import { setUser } from "@/stores/userSlice";
import type { UserProfile } from "@/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import StoresSelector from "./admin/sellPoints/StoresSelector";
import { ROLES } from "./admin/team-members/RoleInfoPopover";
import { Skeleton } from "./ui/skeleton";

export const Header = () => {

  const dispatch = useDispatch();

  const signOutMutation = useMutation({
    mutationFn: async () => {
      return await signOut();
    },
    onSuccess: () => {
      window.location.href = "/sign-in";
    },
  });

  //In this component fetch the user data if the store does not have it
  const { data: userData } = useQuery<UserProfile | null>({
    queryKey: ["user-data"],
    queryFn: async () => {
      const result = await getUserDataByUid();
      return result.data as UserProfile | null;
    },
  });

  useEffect(() => {
    if (userData) {
      dispatch(setUser(userData));
    }
  }, [dispatch, userData]);

  const { role } = useAppSelector((state) => state.user);

  if (!role) {
    return null;
  }

  if (role === "EMPLOYEE") {
    return null;
  }

  return (
    <header 
    // style={{
    //   borderBottom: `1px solid ${STORES_COLORS[selectedStoreIndex % STORES_COLORS.length]}`,
    // }}
     className="border-b border-border bg-card shadow-sm">
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

        {userData ? (
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-foreground">
                {userData?.email}
              </p>
              <p className="text-xs text-muted-foreground">
                Rol:{" "}
                {ROLES.find((role) => role.value === userData?.role)?.label}
              </p>
            </div>

            <Avatar className="w-8 h-8">
              <AvatarImage
                src={`https://ui-avatars.com/api/?name=${
                  userData?.full_name || userData?.email
                }`}
                alt="Usuario"
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {/* JP */}
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
        ) : (
          <Skeleton className="h-8 w-48" />
        )}
      </div>
    </header>
  );
};

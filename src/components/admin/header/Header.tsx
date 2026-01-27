import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAppSelector } from "@/hooks/useUserData";
import { getUserDataByUid } from "@/service/profiles";
import { setUser } from "@/stores/userSlice";
import type { UserProfile } from "@/types/users";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import UserData from "./UserData";

export const Header = () => {
  const dispatch = useDispatch();



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
      className="border-b border-border bg-card shadow-sm"
    >
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

        <UserData userData={userData || null} />


      </div>
    </header>
  );
};

import { _ITEMS } from "@/components/admin/sidebar/AppSidebar";
import { useAppSelector } from "@/hooks/useUserData";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const RolesAuth = () => {
  const { role } = useAppSelector((state) => state.user);
  const location = useLocation();

  if (!role) {
    return null;
  }

  const currentPath = location.pathname;
  const currentMenuItem = MENU_ITEMS.find((item) =>
    currentPath.startsWith(item.url)
  );
  const hasRouteAccess = currentMenuItem
    ? currentMenuItem.roles.includes(role)
    : false;

  if (!hasRouteAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default RolesAuth;

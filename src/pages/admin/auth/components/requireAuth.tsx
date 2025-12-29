import { useUserSession } from "@/hooks/useUserSession";
import { Navigate, Outlet } from "react-router-dom";

const RequireAuth = () => {
  const { lookingForSession, userSession } = useUserSession();

  if (lookingForSession) {
    return null;
  }

  return userSession ? (
    <Outlet />
  ) : (
    <Navigate
      to="/sign-in"
      // state={{ from: location }}
      replace
    />
  );
};

export default RequireAuth;

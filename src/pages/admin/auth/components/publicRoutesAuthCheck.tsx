import { useUserSession } from "@/hooks/useUserSession";
import { Navigate, Outlet } from "react-router-dom";

const PublicRoutesAuthCheck = () => {
  const { lookingForSession, userSession } = useUserSession();

  if (lookingForSession) {
    return null;
  }

  return !userSession ? (
    <Outlet />
  ) : (
    <Navigate
      to="/dashboard"
      // state={{ from: location }}
      replace
    />
  );
};

export default PublicRoutesAuthCheck;

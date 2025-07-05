import { useLocation, Navigate, Outlet } from 'react-router-dom';

const RequireAuth = () => {
    const userId = 'useSelector((state) => state.auth.userId);'
  const location = useLocation();
  

  return userId ? (
    <Outlet />
  ) : (
    <Navigate to="/" state={{ from: location }} replace />
  );
};

export default RequireAuth;

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import RequireAuth from "./components/auth/requireAuth";
import Index from "./pages/Index";
import { SignIn } from "./pages/SignIn";
import { AuthProvider } from "./contexts/AuthContext";
import { SignUp } from "./pages/SignUp";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { ProfileRegister } from "./pages/Register";

const queryClient = new QueryClient();

export const PUBLIC_ROUTES = [
  "/",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/register"
];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/register" element={<ProfileRegister />} />

              <Route element={<RequireAuth />}>
                <Route path="/home" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

{
  /* <Routes>
        <Route path="/wifi" element={<Wifi />} />
        <Route element={<RequireBion />}>
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Login />} />
          <Route path="/forget-password" element={<ForgetPassword />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppWrapper />}>
              <Route path="/bions" element={<Bions />} />
              <Route path="/bions/:bionId" element={<Bion />} />
              <Route path="/files" element={<Files />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/processes/:processId" element={<Process />} />
              <Route
                path="auth/accounts/:action"
                element={<RegistrationRequest />}
              />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/bions" replace />} />
      </Routes> */
}

//       import { useLocation, Navigate, Outlet } from 'react-router-dom';
// import { useSelector } from 'react-redux';
// import { selectCurrentBion } from './bionSlice';

// const RequireBion = () => {
//   const bionId = useSelector(selectCurrentBion);
//   const location = useLocation();

//   return bionId ? (
//     <Outlet />
//   ) : (
//     <Navigate to="/wifi" state={{ from: location }} replace />
//   );
// };

// export default RequireBion;

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Products from "./pages/admin/Products";
import Settings from "./pages/admin/Settings";
import NotFound from "./pages/admin/NotFound";
import RequireAuth from "./components/admin/auth/requireAuth";
import { SignIn } from "./pages/admin/SignIn";
import { AuthProvider } from "./contexts/AuthContext";
import { SignUp } from "./pages/admin/SignUp";
import { ForgotPassword } from "./pages/admin/ForgotPassword";
import { ResetPassword } from "./pages/admin/ResetPassword";
import { ProfileRegister } from "./pages/admin/Register";
import Dashboard from "./pages/admin/Dashboard";
import AdminHome from "./pages/admin/AdminHome";
import SearchContextProvider from "./components/clients/Context/SearchContext";
import CartContextProvider from "./components/clients/Context/CartContext";
import ItemListContainer from "./components/clients/ItemListContainer/ItemListContainer";
import Footer from "./components/clients/Footer/Footer";
import styles from "./App.module.css";
import Navbar from "./components/clients/Navbar/Navbar";
import Stores from "./pages/admin/Stores";

const queryClient = new QueryClient();

export const PUBLIC_ROUTES = [
  "/",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/register",
];

const App = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  const subdomain = parts.length > 1 ? parts[0] : null;
  const isInClientMode = subdomain;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {isInClientMode ? (
          <div
          // className={styles.app}
          >
            <BrowserRouter>
              <SearchContextProvider>
                <CartContextProvider>
                  <Navbar />
                  <Routes>
                    <Route path="/" element={<ItemListContainer />} />
                    <Route
                      path="/category/:categoryName"
                      element={<ItemListContainer />}
                    />
                    <Route
                      path="/ItemSearch/:searchedItem"
                      element={<ItemListContainer />}
                    />
                    {/* <Route
                      path="/itemDetail/:id"
                      element={<ItemDetailContainer />}
                    /> */}

                    {/* <Route path="/cart" element={<Cart />} /> */}
                    {/* <Route path="/checkoutForm" element={<FormCheckout />} /> */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </CartContextProvider>
              </SearchContextProvider>
              <Footer />
            </BrowserRouter>
            <div className={styles.bigScreen}>
              <div className={styles.modal}>
                <p>
                  La aplicación no es compatible con resoluciones tan grandes.
                  Por favor, reduzca el tamaño de la ventana del navegador.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <AuthProvider>
            <BrowserRouter>
              <Layout>
                <Routes>
                  <Route path="/" element={<AdminHome />} />
                  <Route path="/sign-in" element={<SignIn />} />
                  <Route path="/sign-up" element={<SignUp />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/register" element={<ProfileRegister />} />

                  <Route element={<RequireAuth />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/stores" element={<Stores />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </Layout>
            </BrowserRouter>
          </AuthProvider>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import RequireAuth from "./components/admin/auth/requireAuth";
import { Layout } from "./components/Layout";
import NotFound from "./pages/admin/NotFound";
import Settings from "./pages/admin/Settings";
import Stock from "./pages/admin/Stock";

import { Provider } from "react-redux";
import styles from "./App.module.css";
import PublicRoutesAuthCheck from "./components/admin/auth/publicRoutesAuthCheck";
import RolesAuth from "./components/admin/auth/rolesAuth";
import CartContextProvider from "./components/clients/Context/CartContext";
import SearchContextProvider from "./components/clients/Context/SearchContext";
import Footer from "./components/clients/Footer/Footer";
import ItemListContainer from "./components/clients/ItemListContainer/ItemListContainer";
import Navbar from "./components/clients/Navbar/Navbar";
import { UserStoresProvider } from "./contexts/UserStoresContext";
import AdminHome from "./pages/admin/AdminHome";
import { ForgotPassword } from "./pages/admin/auth/ForgotPassword";
import { SignIn } from "./pages/admin/auth/SignIn";
import { SignUp } from "./pages/admin/auth/SignUp";
import Dashboard from "./pages/admin/Dashboard";
import Stores from "./pages/admin/Stores";
import TeamMembers from "./pages/admin/TeamMembers";
import { store } from "./stores/store";
import LoadOrders from "./pages/admin/LoadOrders";
import NewLoadOrders from "./pages/admin/NewLoadOrder";

const queryClient = new QueryClient();

export const PUBLIC_ROUTES = [
  "/",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/register",
  "/register-team-member",
];

const App = () => {
  // const hostname = window.location.hostname;
  // const parts = hostname.split(".");
  // const subdomain = parts.length > 1 ? parts[0] : null;
  // const isInClientMode = subdomain;

  const isInClientMode = false;

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
          <Provider store={store}>
            <UserStoresProvider>
              <BrowserRouter>
                <Layout>
                  <Routes>
                    <Route element={<PublicRoutesAuthCheck />}>
                      <Route path="/" element={<AdminHome />} />
                      <Route path="/sign-in" element={<SignIn />} />
                      <Route path="/sign-up" element={<SignUp />} />
                      <Route
                        path="/forgot-password"
                        element={<ForgotPassword />}
                      />
                    </Route>

                    <Route element={<RequireAuth />}>
                      {/* <Route
                        path="/reset-password"
                        element={<ResetPassword />}
                      />
                      <Route
                        path="/auth/v1/verify"
                        element={<ResetPassword />}
                      /> */}
                      <Route element={<RolesAuth />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/stock" element={<Stock />} />
                        <Route path="/stores" element={<Stores />} />
                        <Route path="/team-members" element={<TeamMembers />} />
                        <Route path="/load-orders" element={<LoadOrders />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<NotFound />} />
                      </Route>
                      <Route
                        path="/load-orders/add-load-order"
                        element={<NewLoadOrders />}
                      />
                    </Route>
                  </Routes>
                </Layout>
              </BrowserRouter>
            </UserStoresProvider>
          </Provider>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

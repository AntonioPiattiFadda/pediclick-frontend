import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as ReactHotToast } from 'react-hot-toast';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import RequireAuth from "./pages/admin/auth/components/requireAuth";
import { Layout } from "./layout/Layout";
import NotFound from "./pages/admin/NotFound";
import Settings from "./pages/admin/settings/Settings";

import { Provider } from "react-redux";
import styles from "./App.module.css";
import PublicRoutesAuthCheck from "./pages/admin/auth/components/publicRoutesAuthCheck";
import RolesAuth from "./pages/admin/auth/components/rolesAuth";
import CartContextProvider from "./components/clients/Context/CartContext";
import SearchContextProvider from "./components/clients/Context/SearchContext";
import Footer from "./components/clients/Footer/Footer";
import ItemListContainer from "./components/clients/ItemListContainer/ItemListContainer";
import Navbar from "./components/clients/Navbar/Navbar";
import AdminHome from "./pages/admin/AdminHome";
import { ForgotPassword } from "./pages/admin/auth/ForgotPassword";
import { SignIn } from "./pages/admin/auth/SignIn";
import { SignUp } from "./pages/admin/auth/SignUp";
import Clients from "./pages/admin/clients/Clients";
import LoadOrder from "./pages/admin/loadOrder/LoadOrder";
import LoadOrders from "./pages/admin/loadOrders/LoadOrders";
import LotContainers from "./pages/admin/lotContainers/LotContainers";
import AddLoadOrder from "./pages/admin/addLoadOrder/AddLoadOrder";
import TeamMembers from "./pages/admin/teamMembers/TeamMembers";
import TransferOrders from "./pages/admin/transferOrders/TransferOrders";
import { store } from "./stores/store";
import Locations from "./pages/admin/locations/Locations";
import Stock from "./pages/admin/stock/Stock";
import { LocationsProvider } from "./contexts/LocationsContext";
import TransferOrder from "./pages/admin/transferOrder/TransferOrder";
import Dashboard from "./pages/admin/dashboard/Dashboard";

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
        <ReactHotToast
          position="bottom-right" />
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

            <BrowserRouter>

              <Layout>
                <LocationsProvider>
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
                        <Route path="/clients" element={<Clients />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/lot-containers" element={<LotContainers />} />
                        <Route path="/locations" element={<Locations />} />
                        <Route path="/load-orders" element={<LoadOrders />} />
                        <Route path="/load-orders/:load-order-id" element={<LoadOrder />} />
                        <Route
                          path="/load-orders/add-load-order"
                          element={<AddLoadOrder />}
                        />

                        <Route path="/team-members" element={<TeamMembers />} />

                        <Route path="/transfer-orders" element={<TransferOrders />} />
                        <Route path="/transfer-orders/:transfer-order-id" element={<TransferOrder />} />
                        <Route path="/stock" element={<Stock />} />

                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<NotFound />} />
                      </Route>
                    </Route>
                  </Routes>
                </LocationsProvider>
              </Layout>
            </BrowserRouter>

          </Provider>
        )}
      </TooltipProvider>
    </QueryClientProvider >
  );
};

export default App;

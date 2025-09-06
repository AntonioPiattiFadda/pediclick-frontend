import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { UseUserStoresContext } from "@/contexts/UserStoresContext";
import { getUserStores } from "@/service/stores";
import { useEffect, useState } from "react";
import NoStoreModal from "../header/NoStoreModal";
import { useAppSelector } from "@/hooks/useUserData";

export const STORES_COLORS = [
  "#FF6B6B", // Rojo coral vibrante
  "#4ECDC4", // Turquesa brillante
  "#45B7D1", // Azul océano
  "#96CEB4", // Verde esmeralda
  "#FFEAA7", // Amarillo dorado
  "#DDA0DD", // Púrpura medio
  "#98D8C8", // Menta vibrante
  "#F7DC6F", // Amarillo limón
  "#BB8FCE", // Lavanda vibrante
  "#85C1E9", // Azul cielo brillante
];

const StoresSelector = () => {
  const { userStores, setUserStores, setSelectedStoreId, selectedStoreId } =
    UseUserStoresContext();

  const { role } = useAppSelector((state) => state.user);

  const [componentState, setComponentState] = useState("loading");

  useEffect(() => {
    if (userStores.length) return;
    const fetchUserStores = async () => {
      const { stores } = await getUserStores(role);
      setUserStores(stores);
      setComponentState("idle");
      if (stores.length > 0) {
        const firstStoreId = stores[0].store_id;
        setSelectedStoreId(firstStoreId);
      }
    };

    fetchUserStores();
  }, []);

  if (componentState === "loading") return <Skeleton className="h-8 w-48" />;

  return (
    <>
      {userStores.length === 0 && <NoStoreModal />}
      <Select
        onValueChange={(value) =>
          setSelectedStoreId(value ? Number(value) : null)
        }
        value={selectedStoreId ? String(selectedStoreId) : ""}
      >
        <SelectTrigger className="w-[280px] relative">
          <SelectValue placeholder="Elige tu punto de venta" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Punto de Venta</SelectLabel>
            {userStores.map((store) => (
              <SelectItem
                key={store.store_id}
                value={store.store_id ? String(store.store_id) : ""}
              >
                {/* <div style={{ backgroundColor: STORES_COLORS[index % STORES_COLORS.length] }} className="w-2.5 h-2.5 rounded-full mr-2"></div> */}
                {store.store_name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  );
};

export default StoresSelector;

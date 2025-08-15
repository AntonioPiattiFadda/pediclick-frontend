import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserStoresContext } from "@/contexts/UserStoresContext";
import { getUserStores } from "@/service";
import { useEffect, useState } from "react";
import NoStoreModal from "../header/noStoreModal";

const StoresSelector = () => {
  const { userStores, setUserStores, setSelectedStoreId, selectedStoreId } =
    useUserStoresContext();

  const [componentState, setComponentState] = useState("loading");

  useEffect(() => {
    if (userStores.length) return;
    const fetchUserStores = async () => {
      const { stores } = await getUserStores();
      setUserStores(stores);
      setComponentState("idle");
      console.log("Tiendas obtenidas:", stores);
      if (stores.length > 0) {
        const firstStoreId = stores[0].store_id;
        setSelectedStoreId(firstStoreId);
      }
    };

    fetchUserStores();
  }, []);

  if (componentState === "loading") return <div>Cargando tiendas...</div>;

  return (
    <>
      {userStores.length === 0 && <NoStoreModal />}
      <Select onValueChange={setSelectedStoreId} value={selectedStoreId || ""}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Elige tu tienda" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Tienda</SelectLabel>
            {userStores.map((store) => (
              <SelectItem key={store.store_id} value={store.store_id}>
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

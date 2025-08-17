"use client";
import type { Store } from "@/types";
import {
  createContext,
  useContext,
  useState,
  type ReactNode
} from "react";

const UserStoresContext = createContext<{
  userStores: Store[];
  setUserStores: React.Dispatch<React.SetStateAction<Store[]>>;
  selectedStoreId: string | null;
  setSelectedStoreId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedStoreIndex: number;
}>({
  userStores: [],
  setUserStores: () => {},
  selectedStoreId: null,
  setSelectedStoreId: () => {},
  selectedStoreIndex: 0
});

export const UserStoresProvider = ({ children }: { children: ReactNode }) => {
  const [userStores, setUserStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const selectedStoreIndex = userStores.findIndex(
    store => String(store.store_id) === (selectedStoreId ?? "")
  );

  return (
    <UserStoresContext.Provider
      value={{
        userStores,
        setUserStores,
        selectedStoreId,
        setSelectedStoreId,
        selectedStoreIndex
      }}
    >
      {children}
    </UserStoresContext.Provider>
  );
};

export const useUserStoresContext = () => useContext(UserStoresContext);

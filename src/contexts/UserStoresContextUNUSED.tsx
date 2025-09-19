"use client";
import type { Store } from "@/types/stores";
import { createContext, useContext, useState, type ReactNode } from "react";

const UserStoresContext = createContext<{
  userStores: Store[];
  setUserStores: React.Dispatch<React.SetStateAction<Store[]>>;
  selectedStoreId: number | null;
  setSelectedStoreId: React.Dispatch<React.SetStateAction<number | null>>;
  selectedStoreIndex: number;
}>({
  userStores: [],
  setUserStores: () => {},
  selectedStoreId: null,
  setSelectedStoreId: () => {},
  selectedStoreIndex: 0,
});

export const UserStoresProvider = ({ children }: { children: ReactNode }) => {
  const [userStores, setUserStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const selectedStoreIndex = userStores.findIndex(
    (store) => store.store_id === (selectedStoreId ?? 0)
  );

  return (
    <UserStoresContext.Provider
      value={{
        userStores,
        setUserStores,
        selectedStoreId,
        setSelectedStoreId,
        selectedStoreIndex,
      }}
    >
      {children}
    </UserStoresContext.Provider>
  );
};

export const UseUserStoresContext = () => useContext(UserStoresContext);

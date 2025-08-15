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
}>({
  userStores: [],
  setUserStores: () => {},
  selectedStoreId: null,
  setSelectedStoreId: () => {},
});

export const UserStoresProvider = ({ children }: { children: ReactNode }) => {
  const [userStores, setUserStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  return (
    <UserStoresContext.Provider
      value={{
        userStores,
        setUserStores,
        selectedStoreId,
        setSelectedStoreId,
      }}
    >
      {children}
    </UserStoresContext.Provider>
  );
};

export const useUserStoresContext = () => useContext(UserStoresContext);

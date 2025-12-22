"use client";
import { getLocations } from "@/service/locations";
import type { Location } from "@/types/locations";
import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, type ReactNode } from "react";

const LocationsContext = createContext<{
    locations: Location[];
}>({
    locations: [],
});

export const LocationsProvider = ({ children }: { children: ReactNode }) => {

    const {
        data: locations = [],
    } = useQuery({
        queryKey: ["locations"],
        queryFn: async () => {
            const response = await getLocations();
            return (response.locations ?? []) as Location[];
        },
    });

    return (
        <LocationsContext.Provider
            value={{
                locations
            }}
        >
            {children}
        </LocationsContext.Provider>
    );
};

export const UseLocationsContext = () => useContext(LocationsContext);

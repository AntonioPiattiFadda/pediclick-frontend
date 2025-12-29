import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";


import { getLocations } from "@/service/locations";
import type { Location } from "@/types/locations";

import { CreateLocation, LocationSelectorRoot } from "../../../../components/admin/selectors/locationSelector";
import TableSkl from "@/components/ui/skeleton/tableSkl";
import { LocationsTable } from "./LocationsTable";

export const LocationsContainer = () => {

    const {
        data: locations = [],
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["locations"],
        queryFn: async () => {
            const response = await getLocations();
            return (response.locations ?? []) as Location[];
        },
    });


    if (isLoading) return <TableSkl />;
    if (isError) return <div>Error loading locations.</div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                        <div>
                            <CardTitle>Ubicaciones</CardTitle>
                            <CardDescription>Gestiona tiendas y depósitos</CardDescription>
                        </div>


                        <div>
                            <LocationSelectorRoot value={null} onChange={() => { }}>
                                <CreateLocation />
                            </LocationSelectorRoot>
                        </div>

                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <LocationsTable locations={locations} />
                </CardContent>
            </Card>
        </div>
    );
};

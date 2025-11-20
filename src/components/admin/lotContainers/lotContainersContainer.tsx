import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import TableSkl from "../stock/ui/tableSkl";
import { getLotContainers, getLotContainersLocation } from "@/service/lotContainer";
import LotContainerTable from "./lotContainerTable";
import LotContainersLocationTable from "./lotContainersLocationTable";

export const LotContainersContainer = () => {
    // const [searchTerm, setSearchTerm] = useState("");
    // const [selectedCategory, setSelectedCategory] = useState("all");
    // const [selectedStatus, setSelectedStatus] = useState("all");

    const {
        data: lotContainers = [],
        isLoading: isLoadingLotContainers,
        isError: isErrorLotContainers,
    } = useQuery({
        queryKey: ["lot-containers"],
        queryFn: async () => {
            const response = await getLotContainers();
            return response.lotContainers;
        },
    });

    const {
        data: lotContainersLocation = [],
        isLoading: isLoadingLotContainersLocation,
        isError: isErrorLotContainersLocation,
    } = useQuery({
        queryKey: ["lot-containers-location"],
        queryFn: async () => {
            const response = await getLotContainersLocation();
            return response.lotContainersLocation;
        },
    });



    if (isLoadingLotContainers || isLoadingLotContainersLocation) {
        return <TableSkl />;
    }

    if (isErrorLotContainers || isErrorLotContainersLocation) {
        return <div>Error cargando vacios.</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Contenedores</CardTitle>
                            <CardDescription>Gestiona contenedores y ubicaciones</CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            {/* <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Importar Excel
              </Button> */}
                            {/* <AddStoreBtn /> */}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Tabla de contenedores */}
                    <LotContainerTable lotContainers={lotContainers} />

                    {/* Tabla de localizaciones */}
                    <LotContainersLocationTable locations={lotContainersLocation} />
                </CardContent>
            </Card>
        </div>
    );
};

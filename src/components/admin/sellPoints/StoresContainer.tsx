import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddStoreBtn } from "./AddStoreBtn";
import { StoresTable } from "./StoresTable";
import { useQuery } from "@tanstack/react-query";
import { getUserStores } from "@/service/stores";
import TableSkl from "./ui/tableSkl";

export const StoresContainer = () => {
  // const [searchTerm, setSearchTerm] = useState("");
  // const [selectedCategory, setSelectedCategory] = useState("all");
  // const [selectedStatus, setSelectedStatus] = useState("all");

  const {
    data: stores = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const response = await getUserStores();
      return response.stores;
    },
  });

  if (isLoading) {
    return <TableSkl />;
  }

  if (isError) {
    return <div>Error loading stores.</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Puntos de Venta</CardTitle>
              <CardDescription>Gestiona tus puntos de venta</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Importar Excel
              </Button> */}
              <AddStoreBtn />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <StoresTable stores={stores} />
        </CardContent>
      </Card>
    </div>
  );
};

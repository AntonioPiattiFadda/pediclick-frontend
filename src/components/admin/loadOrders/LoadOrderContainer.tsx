import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UseUserStoresContext } from "@/contexts/UserStoresContext";
import { useAppSelector } from "@/hooks/useUserData";
import { getAllLoadOrders } from "@/service/loadOrders";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import TableSkl from "../sellPoints/ui/tableSkl";
import { LoadOrderTable } from "./LoadOrderTable";

export const LoadOrderContainer = () => {
  // const [searchTerm, setSearchTerm] = useState("");
  // const [selectedCategory, setSelectedCategory] = useState("all");
  // const [selectedStatus, setSelectedStatus] = useState("all");
  const { selectedStoreId } = UseUserStoresContext();

  const { role } = useAppSelector((state) => state.user);

  const {
    data: dbLoadOrders,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["load-orders"],
    queryFn: async () => {
      const response = await getAllLoadOrders(role);
      return response.dbLoadOrders;
    },
    enabled: selectedStoreId !== null,
  });

  if (isLoading) {
    return <TableSkl />;
  }

  if (isError) {
    return <TableSkl />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Remitos</CardTitle>
              <CardDescription>Gestiona tus remitos</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                to="/load-orders/add-load-order"
                className="text-sm underline"
              >
                <Button>Crear orden de carga</Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar productos por nombre, SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="electronics">Electrónicos</SelectItem>
                <SelectItem value="smartphones">Smartphones</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="out_of_stock">Sin stock</SelectItem>
              </SelectContent>
            </Select>
          </div> */}

          <LoadOrderTable loadOrders={dbLoadOrders} />
        </CardContent>
      </Card>
    </div>
  );
};

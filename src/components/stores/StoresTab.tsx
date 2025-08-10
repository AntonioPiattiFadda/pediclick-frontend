import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUserStores } from "@/service";
import { useQuery } from "@tanstack/react-query";
import TableSkl from "./ui/tableSkl";

export const StoresTab = () => {
  // const [searchTerm, setSearchTerm] = useState("");
  // const [selectedCategory, setSelectedCategory] = useState("all");
  // const [selectedStatus, setSelectedStatus] = useState("all");

  const {
    data: stores = [],
    isLoading,
    // isError,
  } = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const response = await getUserStores();
      return response.stores;
    },
  });

  console.log("stores", stores);

  if (isLoading) {
    return <TableSkl />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Tiendas</CardTitle>
              <CardDescription>Gestiona tus tiendas</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Importar Excel
              </Button> */}
              {/* <AddProductBtn /> */}
            </div>
          </div>
        </CardHeader>
        {/* <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
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
          </div>

          <StoresTable products={products}  />
        </CardContent> */}
      </Card>
    </div>
  );
};

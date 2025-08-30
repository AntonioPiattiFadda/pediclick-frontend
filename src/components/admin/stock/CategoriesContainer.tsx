import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCategories } from "@/service/categories";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { CategoriesTable } from "./CategoriesTable";
import TableSkl from "./ui/tableSkl";
import { useAppSelector } from "@/hooks/useUserData";
import { SubCategoriesTable } from "./addEditProduct/SubCategoriesTable ";
import { getSubCategories } from "@/service/subCategories";

export const CategoriesContainer = () => {
  // const [searchTerm, setSearchTerm] = useState("");
  // const [selectedStatus, setSelectedStatus] = useState("all");

  const { role } = useAppSelector((state) => state.user);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await getCategories(role);
      return response.categories;
    },
  });

  const { data: subCategories, isLoading: isLoadingSub } = useQuery({
    queryKey: ["sub-categories"],
    queryFn: async () => {
      const response = await getSubCategories(role);
      return response.categories;
    },
  });

  if (isLoading || isLoadingSub) {
    return <TableSkl />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Rubros</CardTitle>
              <CardDescription>
                Organiza tus productos en rubros
              </CardDescription>
            </div>
            {/* <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Rubro
            </Button> */}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar categorías..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activa</SelectItem>
                <SelectItem value="inactive">Inactiva</SelectItem>
              </SelectContent>
            </Select>
          </div> */}
          {/* <CategoriesTable categories={subCategories ?? []} /> */}
          <CategoriesTable categories={categories ?? []} />
        </CardContent>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Categorías</CardTitle>
              <CardDescription>
                Organiza tus productos en categorías
              </CardDescription>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nueva Categoría
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SubCategoriesTable subCategories={subCategories ?? []} />
        </CardContent>
      </Card>
    </div>
  );
};

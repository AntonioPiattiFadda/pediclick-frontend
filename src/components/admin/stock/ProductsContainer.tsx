import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAllProducts } from "@/service/products";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { AddProductBtn } from "./addEditProduct/AddProductBtn";
import { ProductsTable } from "./ProductsTable";
import TableSkl from "./ui/tableSkl";
import { useAppSelector } from "@/hooks/useUserData";

export const ProductsContainer = () => {
  const [searchTerm, setSearchTerm] = useState("");
  // const [selectedCategory, setSelectedCategory] = useState("all");
  // const [selectedStatus, setSelectedStatus] = useState("all");

  const { role } = useAppSelector((state) => state.user);

  const {
    data: products = [],
    isLoading,
    // isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await getAllProducts(role);
      // Ensure each product has seller_id
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return response.products.map((product: any) => ({
        // seller_id: product.seller_id ?? "", // Provide a fallback or handle as needed
        ...product,
      }));
    },
  });

  console.log("Products:", products);

  const filteredProducts = products.filter((product) => {
    const matchesSearchTerm = product.product_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesShortCode = product.short_code
      ?.toString()
      .includes(searchTerm);

    const matchesBarcode = product.barcode?.toString().includes(searchTerm);

    return matchesSearchTerm || matchesShortCode || matchesBarcode;
  });

  if (isLoading) {
    return <TableSkl />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Productos</CardTitle>
              <CardDescription>
                Gestiona tu catálogo de productos
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Importar Excel
              </Button> */}
              <AddProductBtn />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar productos por nombre, código corto o código de barras"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* <Select
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
            </Select> */}
          </div>

          <ProductsTable
            products={filteredProducts ?? []}
            isSearchingTerm={searchTerm.length > 0}
          />
        </CardContent>
      </Card>
    </div>
  );
};

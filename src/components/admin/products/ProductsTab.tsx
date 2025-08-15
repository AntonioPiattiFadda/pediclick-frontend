import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllProducts } from "@/service/products";
import { useQuery } from "@tanstack/react-query";
import { Search, Upload } from "lucide-react";
import { useState } from "react";
import { AddProductBtn } from "./AddProductBtn";
import { ProductsTable } from "./ProductsTable";
import TableSkl from "./ui/tableSkl";


// const mockProducts = [
//   {
//     id: 1,
//     name: 'Laptop Gaming ASUS ROG',
//     sku: 'LG-ASUS-001',
//     category: 'Electrónicos',
//     price: 1299.99,
//     stock: 15,
//     status: 'active',
//     image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853',
//   },
//   {
//     id: 2,
//     name: 'iPhone 15 Pro Max',
//     sku: 'IP-15PM-001',
//     category: 'Smartphones',
//     price: 1199.99,
//     stock: 8,
//     status: 'active',
//     image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd',
//   },
//   {
//     id: 3,
//     name: 'Samsung Galaxy S24',
//     sku: 'SGS-24-001',
//     category: 'Smartphones',
//     price: 899.99,
//     stock: 0,
//     status: 'out_of_stock',
//     image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9',
//   },
// ];

export const ProductsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const {
    data: products = [],
    isLoading,
    // isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await getAllProducts();
      return response.products;
    },
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
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Importar Excel
              </Button>
              <AddProductBtn />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <ProductsTable products={products}  />
        </CardContent>
      </Card>
    </div>
  );
};

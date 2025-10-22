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
import { ProductTableRendererClientSide } from "../shared/productTableRendererClientSide";
import TableSkl from "./ui/tableSkl";
// import { StoreSelector } from "../shared/StoresSelector";
import { Button } from "@/components/ui/button";
import { CategorySelectorRoot, SelectCategory } from "../shared/categorySelector";
import { SelectSubCategory, SubCategorySelectorRoot } from "../shared/subCategorySelector";
import { SelectStockRoom, StockroomSelectorRoot } from "../shared/stockRoomSelector";
import AddStock from "./AddStock";
import { SelectStore, StoreSelectorRoot } from "../shared/storesSelector";





export const ProductsContainer = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedStockRoom, setSelectedStockRoom] = useState<number | null>(null);

  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await getAllProducts();
      return response.products
    },
  });

  const filteredProducts = products.filter((product) => {
    const matchesSearchTerm = product.product_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesShortCode = product.short_code
      ?.toString()
      .includes(searchTerm);

    const matchesBarcode = product.barcode?.toString().includes(searchTerm);

    const matchesStore = selectedStore
      ? product.lots?.some((lot) =>
        lot.stock?.some((stock) => stock.store_id === selectedStore)
      )
      : true;

    const matchesStockRoom = selectedStockRoom
      ? product.lots?.some((lot) =>
        lot.stock?.some((stock) => stock.stock_room_id === selectedStockRoom)
      )
      : true;

    const matchesCategory = selectedCategory
      ? product.category_id === selectedCategory
      : true;

    const matchesSubCategory = selectedSubCategory
      ? product.sub_category_id === Number(selectedSubCategory)
      : true;

    return (
      matchesStore &&
      matchesStockRoom &&
      matchesCategory &&
      matchesSubCategory &&
      (matchesSearchTerm || matchesShortCode || matchesBarcode)
    );
  });

  // TODO Esto queda colgado pero tenemos que asislarlo para que la crecion de un nuevo producto l

  if (isLoading) {
    return <TableSkl />;
  }

  if (isError) {
    return <div>Error loading products.</div>;
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
              <AddStock />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-full grid grid-cols-6 gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar productos por nombre, código corto o código de barras"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>



            <StoreSelectorRoot value={selectedStore} onChange={setSelectedStore} disabled={false}>
              <SelectStore />
            </StoreSelectorRoot>

            <CategorySelectorRoot value={selectedCategory} onChange={setSelectedCategory} disabled={false}>
              <SelectCategory />
            </CategorySelectorRoot>

            <SubCategorySelectorRoot value={selectedSubCategory ?? ""} onChange={setSelectedSubCategory} disabled={false}>
              <SelectSubCategory />
            </SubCategorySelectorRoot>

            <StockroomSelectorRoot value={selectedStockRoom} onChange={setSelectedStockRoom} disabled={false}>
              <SelectStockRoom />
            </StockroomSelectorRoot>

            <Button className="w-[120px] ml-auto" onClick={() => {
              setSearchTerm("");
              setSelectedStore(null);
              setSelectedCategory(null);
              setSelectedSubCategory(null);
              setSelectedStockRoom(null);
            }}>Resetear filtros</Button>

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

          <ProductTableRendererClientSide defaultData={filteredProducts} />

          {/* <ProductsTable
            products={filteredProducts ?? []}
            isSearchingTerm={searchTerm.length > 0}
          /> */}
        </CardContent>
      </Card>
    </div>
  );
};

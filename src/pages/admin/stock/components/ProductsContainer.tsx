import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAllProducts, getAllSoldProducts } from "@/service/products";
import type { Location } from "@/types/locations";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import TableSkl from "../../../../components/ui/skeleton/tableSkl";
import { ProductTableRenderer } from "./productTableRenderer";
import { CategorySelectorRoot, SelectCategory } from "../../../../components/admin/shared/selectors/categorySelector";
import { CancelLocationSelection, LocationSelectorRoot, SelectLocation } from "../../../../components/admin/shared/selectors/locationSelector";
import { SelectSubCategory, SubCategorySelectorRoot } from "../../../../components/admin/shared/selectors/subCategorySelector";
import AddStock from "./AddStock";
import { Label } from "@/components/ui/label"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox";

export const ProductsContainer = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<Pick<Location, 'location_id' | 'name' | 'type'> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | null>(null);

  const [stockTypeToShow, setStockTypeToShow] = useState<'STOCK' | 'SOLD'>('STOCK');

  const [viewUnassignedOnly, setViewUnassignedOnly] = useState<boolean>(false);

  const {
    data: products = [],
    isLoading,
    isError,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await getAllProducts();
      return response.products
    },
  });

  const {
    data: soldStockProducts = [],
    isLoading: isLoadingSoldStock,
    isError: isErrorSoldStock,
    // refetch: refetchSoldStock,
    // isRefetching: isRefetchingSoldStock
  } = useQuery({
    queryKey: ["sold-stock-products"],
    queryFn: async () => {
      const response = await getAllSoldProducts();
      return response.products
    },
  });

  const productsToUse = stockTypeToShow === 'STOCK' ? products : soldStockProducts;

  const filteredByLocation = productsToUse
    .map((product) => {
      if (!selectedLocation && !viewUnassignedOnly) return product;

      const locationId = selectedLocation?.location_id || null;

      const filteredPresentations =
        product.product_presentations
          ?.map((presentation) => {
            const filteredLots =
              presentation.lots
                ?.map((lot) => {
                  const filteredStock =
                    lot.stock?.filter(
                      (stock) =>
                        stock.location_id === locationId &&
                        stock.quantity > 0
                    ) ?? [];

                  if (filteredStock.length === 0) return null;

                  return {
                    ...lot,
                    stock: filteredStock,
                  };
                })
                .filter(Boolean) ?? [];

            if (filteredLots.length === 0) return null;

            return {
              ...presentation,
              lots: filteredLots,
            };
          })
          .filter(Boolean) ?? [];

      if (filteredPresentations.length === 0) return null;

      return {
        ...product,
        product_presentations: filteredPresentations,
      };
    })
    .filter(Boolean);

  const filteredProducts = filteredByLocation.filter((product) => {
    if (!product) return false;

    const matchesSearchTerm = product.product_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesShortCode = product.short_code
      ?.toString()
      .includes(searchTerm);

    const matchesBarcode = product.barcode?.toString().includes(searchTerm);

    const matchesCategory = selectedCategory
      ? product.category_id === selectedCategory
      : true;

    const matchesSubCategory = selectedSubCategory
      ? product.sub_category_id === Number(selectedSubCategory)
      : true;

    return (
      matchesCategory &&
      matchesSubCategory &&
      (matchesSearchTerm || matchesShortCode || matchesBarcode)
    );
  });

  // TODO Esto queda colgado pero tenemos que asislarlo para que la crecion de un nuevo producto l

  if (isLoading && stockTypeToShow === 'STOCK') {
    return <TableSkl />;
  }

  if (isLoadingSoldStock && stockTypeToShow === 'SOLD') {
    return <TableSkl />;
  }

  if (isError || isErrorSoldStock) {
    return <div>Error loading products.</div>;
  }

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setSelectedLocation(null);
  };

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
              <Button
                variant="outline"
                size={'icon'}

                disabled={isRefetching}
                onClick={() => {
                  refetch()
                }}
              >
                <RefreshCw className={`w-4 h-4 scale-x-[-1] ${isRefetching ? 'animate-spin' : ''}`} />
              </Button>
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

            <div className="col-span-2 grid grid-cols-[2fr_1fr] gap-4 w-full">

              <LocationSelectorRoot
                value={selectedLocation}
                onChange={(value) => {
                  setSelectedLocation(value);
                  setViewUnassignedOnly(false);
                }}>
                <SelectLocation />
                <CancelLocationSelection />
              </LocationSelectorRoot>


              <div className="flex flex-row gap-2 items-center">
                <Checkbox
                  checked={viewUnassignedOnly}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedLocation(null);
                    }
                    setViewUnassignedOnly(!!checked);
                  }}
                />
                <Label>No assignados</Label>
              </div>
            </div>


            <CategorySelectorRoot value={selectedCategory} onChange={setSelectedCategory} disabled={false}>
              <SelectCategory />
            </CategorySelectorRoot>

            <SubCategorySelectorRoot
              value={selectedSubCategory ?? null}
              onChange={setSelectedSubCategory} disabled={false}>
              <SelectSubCategory />
            </SubCategorySelectorRoot>


            <Button className="w-[120px] ml-auto"
              onClick={() => {
                handleResetFilters();
              }}>
              Resetear filtros</Button>


            <div className="relative flex-1">
              <Label>Visualizar</Label>


              <RadioGroup value={stockTypeToShow} onValueChange={(value) => {
                setStockTypeToShow(value as 'STOCK' | 'SOLD')
              }} defaultValue="STOCK" className="flex flex-row gap-4 mt-2" >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="STOCK" id="r1" />
                  <Label htmlFor="r1">En stock</Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="SOLD" id="r3" />
                  <Label htmlFor="r3">Vendido</Label>
                </div>
              </RadioGroup>

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

          <ProductTableRenderer defaultData={filteredProducts} />

          {/* <ProductsTable
            products={filteredProducts ?? []}
            isSearchingTerm={searchTerm.length > 0}
          /> */}
        </CardContent>
      </Card>
    </div>
  );
};

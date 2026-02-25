import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAllAvailableProducts, getAllProductsInStock, getAllSoldProducts } from "@/service/products";
import type { Location } from "@/types/locations";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import TableSkl from "../../../../components/ui/skeleton/tableSkl";
import { ProductTableRenderer } from "./productTableRenderer";
import { CategorySelectorRoot, SelectCategory } from "../../../../components/admin/selectors/categorySelector";
import { SelectSubCategory, SubCategorySelectorRoot } from "../../../../components/admin/selectors/subCategorySelector";
import AddStock from "./AddStock";
import { Label } from "@/components/ui/label"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseLocationsContext } from "@/contexts/LocationsContext";
import type { StockTypeToShow } from "@/types";


export const ProductsContainer = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState<Pick<Location, 'location_id' | 'name' | 'type'> | 'NO_LOCATION' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | null>(null);
  const [stockTypeToShow, setStockTypeToShow] = useState<StockTypeToShow>('STOCK');

  const { locations } = UseLocationsContext();

  const locationTypes = {
    STORE: "Punto de venta",
    STOCK_ROOM: "Depósito",
  };

  const {
    data: products = [],
    isLoading,
    isError,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await getAllProductsInStock();
      return response.products
    },
  });

  const {
    data: soldStockProducts = [],
    isLoading: isLoadingSoldStock,
    isError: isErrorSoldStock,
    refetch: refetchSoldStock,
    isRefetching: isRefetchingSoldStock
  } = useQuery({
    queryKey: ["sold-stock-products"],
    queryFn: async () => {
      const response = await getAllSoldProducts();
      return response.products
    },
  });

  const {
    data: allProducts = [],
    isLoading: isLoadingAllProducts,
    isError: isErrorAllProducts,
    refetch: refetchAllProducts,
    isRefetching: isRefetchingAllProducts
  } = useQuery({
    queryKey: ["all-products"],
    queryFn: async () => {
      const response = await getAllAvailableProducts();
      return response.products
    },
  });

  const getNonStockProducts = (locationId: number | null) => {
    return allProducts.filter((noStockProduct) => {
      const existsWithStock = products.some((product) => {
        if (product.product_id !== noStockProduct.product_id) return false;

        return product.product_presentations?.some((presentation) =>
          presentation.lots?.some((lot) =>
            lot.stock?.some((stock) =>
              locationId
                ? stock.location_id === locationId && stock.quantity > 0
                : stock.quantity > 0
            )
          )
        );
      });

      // 👉 Nos quedamos solo con los que NO existen con stock
      return !existsWithStock;
    });
  };

  const activeLocationId = locationFilter === null || locationFilter === 'NO_LOCATION' ? null : locationFilter.location_id;
  const nonStockProducts = getNonStockProducts(activeLocationId);

  const getProductToUse = () => {
    if (stockTypeToShow === 'STOCK') return products;
    if (stockTypeToShow === 'SOLD') return soldStockProducts;
    if (stockTypeToShow === 'NO-STOCK') return nonStockProducts;
    if (stockTypeToShow === 'ALL') {
      const stockIds = new Set(products.map(p => p.product_id));
      const onlyNoStock = nonStockProducts.filter(p => !stockIds.has(p.product_id));
      return [...products, ...onlyNoStock];
    }
    return products;
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const productsToUse = useMemo(() => getProductToUse(), [stockTypeToShow, products, soldStockProducts, allProducts, nonStockProducts]);

  const filteredByLocation = (stockTypeToShow === 'NO-STOCK' || stockTypeToShow === 'ALL') ? productsToUse : productsToUse
    .map((product) => {
      if (locationFilter === null) return product;

      const locationId = locationFilter === 'NO_LOCATION' ? null : locationFilter.location_id;

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
  }).sort((a, b) => a!.product_name.localeCompare(b!.product_name));

  if (isLoadingAllProducts && (stockTypeToShow === 'NO-STOCK' || stockTypeToShow === 'ALL')) {
    return <TableSkl />;
  }

  if (isLoading && (stockTypeToShow === 'STOCK' || stockTypeToShow === 'ALL')) {
    return <TableSkl />;
  }

  if (isLoadingSoldStock && stockTypeToShow === 'SOLD') {
    return <TableSkl />;
  }

  if (isError || isErrorSoldStock || isErrorAllProducts) {
    return <div>Error loading products.</div>;
  }

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setLocationFilter(null);
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

                disabled={(isRefetching && stockTypeToShow === 'STOCK') || (isRefetchingSoldStock && stockTypeToShow === 'SOLD') || (isRefetchingAllProducts && stockTypeToShow === 'NO-STOCK')}
                onClick={() => {
                  if (stockTypeToShow === 'SOLD') {
                    refetchSoldStock();
                    return;
                  }
                  if (stockTypeToShow === 'STOCK' || stockTypeToShow === 'NO-STOCK') {
                    refetch()
                    refetchAllProducts()
                    return;
                  }

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

            <div className="col-span-2">
              <Select
                value={
                  locationFilter === null ? "ALL_LOCATIONS" :
                    locationFilter === 'NO_LOCATION' ? "NO_LOCATION" :
                      locationFilter.location_id.toString()
                }
                onValueChange={(val) => {
                  if (val === "ALL_LOCATIONS") setLocationFilter(null);
                  else if (val === "NO_LOCATION") setLocationFilter('NO_LOCATION');
                  else {
                    const found = locations.find(l => l.location_id.toString() === val);
                    setLocationFilter(found ?? null);
                  }
                }}
              >
                <SelectTrigger className="h-11 w-full border-gray-200">
                  <SelectValue placeholder="Seleccionar ubicación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_LOCATIONS">Todas las ubicaciones</SelectItem>
                  <SelectGroup>
                    <SelectLabel>Ubicaciones</SelectLabel>
                    {locations.map((l) => (
                      <SelectItem key={l.location_id} value={l.location_id.toString()}>
                        {`${locationTypes[l.type as keyof typeof locationTypes]} - ${l.name}`}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectItem value="NO_LOCATION">Sin ubicación asignada</SelectItem>
                </SelectContent>
              </Select>
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
                setStockTypeToShow(value as StockTypeToShow)
              }} defaultValue="STOCK" className="flex flex-row gap-4 mt-2 " >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="SOLD" id="r3" />
                  <Label className="w-20" htmlFor="r3">Vendido</Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="STOCK" id="r1" />
                  <Label className="w-20" htmlFor="r1">En stock</Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="NO-STOCK" id="r2" />
                  <Label className="w-20" htmlFor="r2">Sin stock</Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="ALL" id="r4" />
                  <Label className="w-20" htmlFor="r4">Todos</Label>
                </div>
              </RadioGroup>

            </div>

          </div>

          <ProductTableRenderer defaultData={filteredProducts} />

        </CardContent>
      </Card>
    </div>
  );
};

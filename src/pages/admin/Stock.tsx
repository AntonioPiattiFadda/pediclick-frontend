import { CategoriesContainer } from "@/components/admin/stock/CategoriesContainer";
import { ProductsContainer } from "@/components/admin/stock/ProductsContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Stock = () => {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Gestión de Productos
        </h1>
        <p className="text-muted-foreground">
          Administra tu catálogo de productos y categorías
        </p>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          <ProductsContainer />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <CategoriesContainer />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Stock;

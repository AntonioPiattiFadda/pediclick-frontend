import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductsTab } from '@/components/products/ProductsTab';
import { CategoriesTab } from '@/components/products/CategoriesTab';

const Products = () => {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestión de Productos</h1>
        <p className="text-muted-foreground">
          Administra tu catálogo de productos y categorías
        </p>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          <ProductsTab />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <CategoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Products;
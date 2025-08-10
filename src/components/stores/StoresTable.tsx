import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Store } from "@/types";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Edit, Trash2 } from "lucide-react";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import type { Product } from "@/types";
// import { getCurrencySymbol } from "@/utils";
// import { Input } from "../ui/input";
// import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { deleteProduct } from "@/service";

interface StoresTableProps {
  stores: Store[];
}

export const StoresTable = ({ stores }: StoresTableProps) => {

  console.log("stores", stores);
  // const queryClient = useQueryClient();

  // const getStatusBadge = (status: string, stock: number) => {
  //   if (stock === 0) {
  //     return <Badge variant="destructive">Sin Stock</Badge>;
  //   }
  //   switch (status) {
  //     case "active":
  //       return <Badge variant="default">Activo</Badge>;
  //     case "draft":
  //       return <Badge variant="secondary">Borrador</Badge>;
  //     case "out_of_stock":
  //       return <Badge variant="destructive">Sin Stock</Badge>;
  //     default:
  //       return <Badge variant="secondary">{status}</Badge>;
  //   }
  // };

  // const deleteProductMutation = useMutation({
  //   mutationFn: async (productId: string | number) => {
  //     await deleteProduct(productId); // tu función para eliminar
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["products"] }); // refresca los productos
  //   },
  // });

  return (
    <div className="rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead className="text-center">Stock</TableHead>
            <TableHead className="text-center">Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage
                      className="object-cover"
                      src={product?.product_images[0]?.url}
                      alt={product.name}
                    />
                    <AvatarFallback>{product.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.sku}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell className="text-right font-medium">
                <div className="flex">
                  <div className="flex flex-col items-end gap-1">
                    {product.product_prices?.map((price, idx) => (
                      <span key={idx}>
                        {getCurrencySymbol(price.currency)}{" "}
                        {price.price.toFixed(2)} {price.units?.symbol}
                      </span>
                    ))}
                  </div>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                      >
                        Editar precios
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-2">
                        {product.product_prices?.map((price, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="w-6 text-muted-foreground">
                              {getCurrencySymbol(price.currency)}
                            </span>
                            <Input
                              type="number"
                              className="h-8"
                              defaultValue={price.price}
                              onChange={(e) => {
                                // lógica para actualizar el precio
                              }}
                            />
                            <span className="text-muted-foreground">
                              {price.units?.symbol}
                            </span>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </TableCell>

              <TableCell className="text-center">
                <span
                  className={
                    product.stock <= 5 ? "text-red-600 font-semibold" : ""
                  }
                >
                  {product.stock}
                </span>
              </TableCell>
              <TableCell className="text-center">
                {getStatusBadge(product.status, product.stock)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4" />
                  </Button>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={deleteProductMutation.isLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-64 space-y-2">
                      <p className="text-sm text-muted-foreground text-center">
                        Are you sure you want to delete this product? <br />
                        <span className="text-red-500 font-medium">
                          This action cannot be undone.
                        </span>
                      </p>
                      <div className="flex justify-end gap-2">
                       
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={deleteProductMutation.isLoading}
                          onClick={() =>
                            deleteProductMutation.mutate(product.id)
                          }
                        >
                          {deleteProductMutation.isLoading ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </TableCell>
            </TableRow>
          ))} */}
        </TableBody>
      </Table>
    </div>
  );
};

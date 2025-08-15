import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUserStoresContext } from "@/contexts/UserStoresContext";
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



export const StoresTable = () => {
  const { userStores } = useUserStoresContext();

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
            <TableHead>Tienda</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead className="text-center">Stock</TableHead>
            <TableHead className="text-center">Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {userStores.map((store) => (
            <TableRow key={store.store_id}>
              <TableCell>{store.store_name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

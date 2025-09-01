/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getAllProducts } from "@/service/products";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import TableSkl from "../stock/ui/tableSkl";
import { ProductSelector } from "../shared/ProductSelector";
import { emptyLoadOrder } from "./emptyFormData";

export function AddLoadOrderBtn() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadOrderData, setLoadOrderData] = useState(emptyLoadOrder);

  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await getAllProducts();

      return response.products.map((product: any) => ({
        ...product,
      }));
    },
  });

  if (isLoading) {
    return <TableSkl />;
  }

  if (isError) {
    return <TableSkl />;
  }

  

  console.log(loadOrderData);

  //   Formulario que llena todo
  //     -eSTADOP VaultIcon

  // TODO: FORMULARIO DE REMITO (LOTE, ID PRODUCTO, PROVEEDOR ID ,)

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-accent" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Agregar elemento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nueva Elemento</DialogTitle>
          <DialogDescription>
            Completá la información del nuevo elemento que querés agregar.
          </DialogDescription>
        </DialogHeader>
        <div>
          <ProductSelector
            products={products}
            isLoading={false}
            value={loadOrderData.lots[0].product_id}
            onChange={(id) =>
              setLoadOrderData({
                ...loadOrderData,
                lots: [{ ...loadOrderData.lots[0], product_id: id }],
              })
            }
          />
        </div>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button>Cancelar</Button>
          </DialogClose>
          <Button>Crear</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

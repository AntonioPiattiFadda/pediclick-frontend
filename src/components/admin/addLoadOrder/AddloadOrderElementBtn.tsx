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
import { Plus } from "lucide-react";
import { useState } from "react";
import { ProductSelector } from "../shared/ProductSelector";
import { emptyLoadOrder } from "./emptyFormData";

export function AddLoadOrderBtn() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadOrderData, setLoadOrderData] = useState(emptyLoadOrder);

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
            value={loadOrderData.lots[0].product_id}
            onChange={(lot) =>
              setLoadOrderData({
                ...loadOrderData,
                //Esto recibve en realidad un lote y lo carga en los lotes antesriores del remito
                lots: [...loadOrderData.lots, lot],
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

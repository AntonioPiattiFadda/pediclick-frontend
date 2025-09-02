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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLot } from "@/service/lots";
import type { Lot } from "@/types/lots";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { emptyLot } from "./emptyFormData";

export function AddLotBtn() {
  const [isShortCreation, setIsShortCreation] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Lot>(emptyLot);

  const queryClient = useQueryClient();

  //   const { role } = useAppSelector((state) => state.user);
  //   const { selectedStoreId } = useUserStoresContext();

  const createLotMutation = useMutation({
    mutationFn: async (data: { completedInformation: Lot }) => {
      return await createLot(data.completedInformation);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsModalOpen(false);
      toast("Elemento creado exitosamente", {
        description: "El elemento ha sido creado correctamente.",
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      });
      setFormData(emptyLot);
    },
    onError: () => {
      toast("Error al agregar el elemento", {
        description: "Intentá nuevamente más tarde.",
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      });
    },
  });

  const handleSubmit = () => {
    // const completedInformation = adaptProductForDb(
    //   formData,
    //   selectedStoreId || 0
    // );

    // const validation = createProductSchema.safeParse(completedInformation);

    // if (!validation.success) {
    //   toast("Algunos datos fantantes ", {
    //     description: "Sunday, December 03, 2023 at 9:00 AM",
    //     action: {
    //       label: "Undo",
    //       onClick: () => console.log("Undo"),
    //     },
    //   });
    //   return;
    // }
    // console.log("completedInformation", completedInformation);
    createLotMutation.mutate({
      completedInformation: formData,
    });
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-accent" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Agregar elemento
        </Button>
      </DialogTrigger>
      <DialogContent className=" w-[750px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nuevo elemento</DialogTitle>
          <DialogDescription>
            Completá la información del nuevo elemento que querés publicar.
          </DialogDescription>
        </DialogHeader>

        {/* <CheckBoxesSelector
          options={[
            { label: "Corto", value: true },
            { label: "Rapido", value: false },
          ]}
          selectedOption={}
          onSelectOption={(value) => setIsShortCreation(value)}
        /> */}

        <div className="flex gap-4">
          <Label htmlFor="lot_number">Nro de Lote</Label>
          <Input
            placeholder="Nro de Lote"
            type="number"
            value={formData.lot_number}
            onChange={(e) =>
              setFormData({ ...formData, lot_number: e.target.value })
            }
          />
        </div>

        <div>
          <Label htmlFor="lot_number">Nro de Lote</Label>
          <Input
            placeholder="Nro de Lote"
            type="number"
            value={formData.lot_number}
            onChange={(e) =>
              setFormData({ ...formData, lot_number: e.target.value })
            }
          />
        </div>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button disabled={createLotMutation.isLoading} variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button disabled={createLotMutation.isLoading} onClick={handleSubmit}>
            {createLotMutation.isLoading ? "Creando..." : "Crear producto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

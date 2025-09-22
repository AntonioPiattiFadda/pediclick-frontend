/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createLotContainer, getLotContainers } from "@/service/lotContainer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import toast from 'react-hot-toast';

type Assignment = {
  lot_container_id: number | null;
  quantity: number | null;
};

interface LotContainerSelectorProps {
  assignments: Assignment[];
  initialQuantity: number; // lot.initial_stock_quantity
  onChange: (assignments: Assignment[]) => void;
  disabled: boolean;
}

export function LotContainerSelector({
  assignments,
  initialQuantity,
  onChange,
  disabled,
}: LotContainerSelectorProps) {
  const queryClient = useQueryClient();

  const { data: lotContainers, isLoading } = useQuery({
    queryKey: ["lot-containers"],
    queryFn: async () => {
      const response = await getLotContainers();
      return response.lotContainers;
    },
  });

  const [newLotContainerData, setNewLotContainerData] = useState({
    lot_container_name: "",
    lot_container_price: "",
  });
  const [open, setOpen] = useState(false);

  const createLotContainerMutation = useMutation({
    mutationFn: async (data: { newLotContainerData: typeof newLotContainerData }) => {
      return await createLotContainer(data.newLotContainerData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["lot-containers"] });

      const remaining = computeRemaining(assignments, initialQuantity);
      if (remaining <= 0) {
        toast("No hay unidades restantes");
        setOpen(false);
        return;
      }

      // auto-asignar el restante al nuevo vacío
      const next: Assignment[] = [
        ...assignments,
        { lot_container_id: Number(data.lot_container_id), quantity: remaining },
      ];
      onChange(next);
      setOpen(false);
      setNewLotContainerData({ lot_container_name: "", lot_container_price: "" });
    },
    onError: (error: any) => {
      const errorMessage = error.message;
      toast(errorMessage || "Error creando el vacío");
    },
  });

  const handleCreateLotContainer = async () => {
    if (!newLotContainerData.lot_container_name.trim()) {
      toast("Nombre requerido");
      return;
    }
    try {
      await createLotContainerMutation.mutateAsync({ newLotContainerData });
    } catch (error) {
      console.error("Error creating lot container:", error);
    }
  };

  const totalAssigned = useMemo(
    () =>
      (assignments ?? []).reduce(
        (sum, a) => sum + (Number(a.quantity) || 0),
        0
      ),
    [assignments]
  );
  const remaining = Math.max(0, (Number(initialQuantity) || 0) - totalAssigned);

  if (isLoading) {
    return <Input placeholder="Buscando tus vacíos..." disabled />;
  }

  const handleAddAssignment = () => {
    const rest = computeRemaining(assignments, initialQuantity);
    if (rest <= 0) {
      toast("No hay stock sin asignar ");
      return;
    }
    const next = [...assignments, { lot_container_id: null, quantity: rest }];
    onChange(next);
  };

  const handleRemove = (index: number) => {
    const next = assignments.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleSelectContainer = (index: number, idStr: string) => {
    const id = idStr ? Number(idStr) : null;
    const next = assignments.map((a, i) =>
      i === index ? { ...a, lot_container_id: id } : a
    );
    // si aún no tiene cantidad definida (null o 0), autocompletar con restante
    const current = next[index];
    const currentQty = Number(current.quantity) || 0;
    if (currentQty === 0) {
      const rest = computeRemaining(next, initialQuantity);
      next[index] = { ...current, quantity: rest };
    }
    onChange(next);
  };

  const handleChangeQuantity = (index: number, val: string) => {
    const raw = Number(val);
    const cleaned = Number.isFinite(raw) ? Math.max(0, raw) : 0;

    // máximo permitido = initial - suma de otros
    const sumOthers = assignments.reduce((sum, a, i) => {
      if (i === index) return sum;
      return sum + (Number(a.quantity) || 0);
    }, 0);
    const maxAllowed = Math.max(0, (Number(initialQuantity) || 0) - sumOthers);

    const finalQty = Math.min(cleaned, maxAllowed);
    if (cleaned > maxAllowed) {
      toast(`No podés exceder el stock inicial. Máximo disponible: ${maxAllowed}.`);
    }

    const next = assignments.map((a, i) =>
      i === index ? { ...a, quantity: finalQty } : a
    );
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="grid grid-cols-[30%_70%] items-center ">
        <span className="text-sm text-muted-foreground">
          Restante: {remaining}
        </span>
        <div className="flex items-center gap-2">
          <Button
            className="border border-gray-200"
            disabled={disabled}
            variant="outline"
            onClick={handleAddAssignment}
          >
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                className="border border-gray-200"
                disabled={disabled}
                variant="outline"
              >
                + Nuevo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Crear nuevo vacío</DialogTitle>
                <DialogDescription>
                  Ingresá el nombre y precio del nuevo vacío que quieras crear.
                </DialogDescription>
              </DialogHeader>

              <Input
                value={newLotContainerData.lot_container_name}
                disabled={createLotContainerMutation.isLoading}
                onChange={(e) =>
                  setNewLotContainerData({
                    ...newLotContainerData,
                    lot_container_name: e.target.value,
                  })
                }
                placeholder="Nombre del vacío"
              />

              <Input
                type="number"
                value={newLotContainerData.lot_container_price}
                disabled={createLotContainerMutation.isLoading}
                onChange={(e) =>
                  setNewLotContainerData({
                    ...newLotContainerData,
                    lot_container_price: e.target.value,
                  })
                }
                placeholder="Precio del vacío"
              />

              <DialogFooter>
                <Button
                  disabled={createLotContainerMutation.isLoading}
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  disabled={createLotContainerMutation.isLoading}
                  onClick={handleCreateLotContainer}
                >
                  {createLotContainerMutation.isLoading ? "Creando..." : "Crear"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {(assignments ?? []).map((a, index) => (
          <div key={index} className="grid grid-cols-[1fr_120px_40px] gap-2 items-center">
            <select
              className="w-full border border-gray-200 rounded px-2 py-2"
              value={a.lot_container_id === null ? "" : String(a.lot_container_id)}
              onChange={(e) => handleSelectContainer(index, e.target.value)}
              disabled={disabled}
            >
              <option value="">Seleccionar vacío</option>
              {(lotContainers ?? []).map((lotContainer: any) => (
                <option
                  key={lotContainer.id ?? lotContainer.lot_container_id}
                  value={lotContainer.lot_container_id}
                >
                  {lotContainer.lot_container_name}{" "}
                  {lotContainer.lot_container_price
                    ? `( $${lotContainer.lot_container_price} )`
                    : ""}
                </option>
              ))}
            </select>

            <Input
              type="number"
              value={a.quantity ?? 0}
              onChange={(e) => handleChangeQuantity(index, e.target.value)}
              disabled={disabled}
            />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(index)}
              className="text-red-500 hover:text-red-700"
              disabled={disabled}
              title="Eliminar asignación"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function computeRemaining(assignments: Assignment[], initial: number): number {
  const sum = (assignments ?? []).reduce(
    (s, a) => s + (Number(a.quantity) || 0),
    0
  );
  return Math.max(0, (Number(initial) || 0) - sum);
}

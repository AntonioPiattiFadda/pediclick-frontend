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
import { useAppSelector } from "@/hooks/useUserData";
import { createLotContainer, getLotContainers } from "@/service/lotContainer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface LotContainerSelectProps {
  value: string;
  onChange: (id: string) => void;
  disabled: boolean;
}

export function LotContainerSelector({
  value,
  onChange,
  disabled,
}: LotContainerSelectProps) {
  const queryClient = useQueryClient();

  const { role } = useAppSelector((state) => state.user);

  const { data: lotContainers, isLoading: isLoading } = useQuery({
    queryKey: ["lot-containers"],
    queryFn: async () => {
      const response = await getLotContainers(role);
      return response.lotContainers;
    },
  });

  const [newLotContainerData, setNewLotContainerData] = useState({
    lot_container_name: "",
    lot_container_price: "",
  });
  const [open, setOpen] = useState(false);

  const createLotContainerMutation = useMutation({
    mutationFn: async (data: {
      newLotContainerData: typeof newLotContainerData;
    }) => {
      return await createLotContainer(data.newLotContainerData, role);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["lot-containers"] });
      onChange(data.lot_container_id);
      setOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error.message;
      toast("Error al crear proveedor", {
        description: errorMessage,
      });
    },
  });

  const handleCreateLotContainer = async () => {
    if (!newLotContainerData) return;

    try {
      await createLotContainerMutation.mutateAsync({ newLotContainerData });
      setNewLotContainerData({
        lot_container_name: "",
        lot_container_price: "",
      });
    } catch (error) {
      console.error("Error creating lot container:", error);
    }
  };

  if (isLoading) {
    return <Input placeholder="Buscando tus vacios..." disabled />;
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <select
        className="w-full border border-gray-200 rounded px-2 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">Sin Vacio</option>
        {(lotContainers ?? []).map((lotContainer) => (
          <option key={lotContainer.id} value={lotContainer.lot_container_id}>
            {lotContainer.lot_container_name}
          </option>
        ))}
      </select>

      {/* Si hay selección, mostrar tacho */}
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange("")}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      )}

      {/* Botón para crear nuevo proveedor */}
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
            <DialogTitle>Crear nuevo Vacio</DialogTitle>
            <DialogDescription>
              Ingresá el nombre del nuevo Vacio que quieras crear.
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
            placeholder="Nombre del Vacio"
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
            placeholder="Precio del Vacio"
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
  );
}

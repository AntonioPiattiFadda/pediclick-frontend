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
import { createStore, getUserStores } from "@/service/stores";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface StoreSelectProps {
  value: number | null;
  onChange: (id: number | null) => void;
  disabled: boolean;
}

export function StoreSelector({
  value,
  onChange,
  disabled,
}: StoreSelectProps) {
  const queryClient = useQueryClient();

  const { data: stores, isLoading: isLoading } = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const response = await getUserStores(role);
      return response.stores;
    },
  });

  console.log("Stores en StoreSelector:", stores);

  const [newStore, setNewStore] = useState("");
  const [open, setOpen] = useState(false);

  const { role } = useAppSelector((state) => state.user);

  const createStoreMutation = useMutation({
    mutationFn: async (data: { newStore: string }) => {
      return await createStore({ store_name: data.newStore }, role);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      // If data is an array, use the first element; otherwise, use data directly
      const store = Array.isArray(data) ? data[0] : data;
      onChange(store?.store_id ?? null);
      setOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error.message;
      toast("Error al crear tienda", {
        description: errorMessage,
      });
    },
  });

  const handleCreateStore = async () => {
    if (!newStore) return;

    try {
      await createStoreMutation.mutateAsync({ newStore });
      setNewStore("");
    } catch (error) {
      console.error("Error creating store:", error);
    }
  };

  if (isLoading) {
    return <Input placeholder="Buscando tus tiendas..." disabled />;
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <select
        className="w-full border rounded px-2 py-2"
        disabled={disabled}
        value={value === null ? "" : value}
        onChange={(e) =>
          onChange(e.target.value === "" ? 0 : Number(e.target.value))
        }
      >
        <option value={0}>Sin Tienda</option>
        {(stores ?? []).map((cat) => (
          <option key={cat.store_id} value={cat.store_id}>
            {cat.store_name}
          </option>
        ))}
      </select>

      {/* Si hay selección, mostrar tacho */}
      {value && (
        <Button
          variant="ghost"
          disabled={disabled}
          size="icon"
          onClick={() => onChange(null)}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      )}

      {/* Botón para crear nueva sala de stock */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button disabled={disabled} variant="outline">
            + Nuevo
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crear nueva tienda</DialogTitle>
            <DialogDescription>
              Ingresá el nombre de la nueva tienda que quieras crear.
            </DialogDescription>
          </DialogHeader>

          <Input
            value={newStore}
            disabled={createStoreMutation.isLoading}
            onChange={(e) => setNewStore(e.target.value)}
            placeholder="Nombre de la tienda"
          />

          <DialogFooter>
            <Button
              disabled={createStoreMutation.isLoading}
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              disabled={createStoreMutation.isLoading}
              onClick={handleCreateStore}
            >
              {createStoreMutation.isLoading ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

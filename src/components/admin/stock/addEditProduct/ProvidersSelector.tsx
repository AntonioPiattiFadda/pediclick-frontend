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
import { createProvider } from "@/service";
import type { Provider } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface ProviderSelectProps {
  providers: Provider[];
  isLoading: boolean;
  value: string;
  onChange: (id: string) => void;
}

export function ProviderSelector({
  providers,
  isLoading,
  value,
  onChange,
}: ProviderSelectProps) {
  const queryClient = useQueryClient();

  const [newProvider, setNewProvider] = useState("");
  const [open, setOpen] = useState(false);

  const { role } = useAppSelector((state) => state.user);

  const createProviderMutation = useMutation({
    mutationFn: async (data: { newProvider: string }) => {
      return await createProvider(data.newProvider, role);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      onChange(data.provider_id);
      setOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error.message;
      toast("Error al crear proveedor", {
        description: errorMessage,
      });
    },
  });

  const handleCreateProvider = async () => {
    if (!newProvider) return;

    try {
      await createProviderMutation.mutateAsync({ newProvider });
      setNewProvider("");
    } catch (error) {
      console.error("Error creating provider:", error);
    }
  };

  if (isLoading) {
    return <Input placeholder="Buscando tus proveedores..." disabled />;
  }

  return (
    <div className="flex items-center gap-2 w-full mt-4">
      <select
        className="w-full border rounded px-2 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Sin Proveedor</option>
        {providers.map((provider) => (
          <option key={provider.provider_id} value={provider.provider_id}>
            {provider.provider_name}
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
          <Button variant="outline">+ Nuevo</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear nuevo proveedor</DialogTitle>
            <DialogDescription>
              Ingresá el nombre del nuevo proveedor que quieras crear.
            </DialogDescription>
          </DialogHeader>

          <Input
            value={newProvider}
            disabled={createProviderMutation.isLoading}
            onChange={(e) => setNewProvider(e.target.value)}
            placeholder="Nombre del proveedor"
          />

          <DialogFooter>
            <Button
              disabled={createProviderMutation.isLoading}
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              disabled={createProviderMutation.isLoading}
              onClick={handleCreateProvider}
            >
              {createProviderMutation.isLoading ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
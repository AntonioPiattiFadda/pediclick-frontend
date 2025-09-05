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
import { createBrand, getBrands } from "@/service/brands";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface BrandSelectProps {
  value: string;
  onChange: (id: string) => void;
  disabled: boolean;
}

export function BrandSelector({ value, onChange, disabled }: BrandSelectProps) {
  const queryClient = useQueryClient();

  const [newBrand, setNewBrand] = useState("");
  const [open, setOpen] = useState(false);

  const { role } = useAppSelector((state) => state.user);

  const { data: brands, isLoading: isLoadingBrands } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const response = await getBrands(role);
      return response.brands;
    },
  });

  const createBrandMutation = useMutation({
    mutationFn: async (data: { newBrand: string }) => {
      return await createBrand(data.newBrand, role);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      onChange(data.brand_id);
      setOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error.message;
      toast("Error al crear marca", {
        description: errorMessage,
      });
    },
  });

  const handleCreateBrand = async () => {
    if (!newBrand) return;

    try {
      await createBrandMutation.mutateAsync({ newBrand });
      setNewBrand("");
    } catch (error) {
      console.error("Error creating brand:", error);
    }
  };

  if (isLoadingBrands) {
    return <Input placeholder="Buscando tus marcas..." disabled />;
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <select
        className="w-full border rounded px-2 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">Sin Marca</option>
        {(brands ?? []).map((brand) => (
          <option key={brand.brand_id} value={brand.brand_id}>
            {brand.brand_name}
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

      {/* Botón para crear nueva marca */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button disabled={disabled} variant="outline">
            + Nuevo
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crear nueva marca</DialogTitle>
            <DialogDescription>
              Ingresá el nombre de la nueva marca que quieras crear.
            </DialogDescription>
          </DialogHeader>

          <Input
            value={newBrand}
            disabled={createBrandMutation.isLoading}
            onChange={(e) => setNewBrand(e.target.value)}
            placeholder="Nombre de la marca"
          />

          <DialogFooter>
            <Button
              disabled={createBrandMutation.isLoading}
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              disabled={createBrandMutation.isLoading}
              onClick={handleCreateBrand}
            >
              {createBrandMutation.isLoading ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

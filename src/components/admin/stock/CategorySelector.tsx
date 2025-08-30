/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAppSelector } from "@/hooks/useUserData";
import { createCategory } from "@/service/categories";
import type { Category } from "@/types";
import { Trash2 } from "lucide-react";

interface CategorySelectProps {
  categories: Category[];
  isLoading: boolean;
  value: string;
  onChange: (id: string) => void;
}

export function CategorySelector({
  categories,
  isLoading,
  value,
  onChange,
}: CategorySelectProps) {
  const queryClient = useQueryClient();

  const [newCategory, setNewCategory] = useState("");
  const [open, setOpen] = useState(false);

  const { role } = useAppSelector((state) => state.user);

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { newCategory: string }) => {
      return await createCategory(data.newCategory, role);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onChange(data.category_id);
      setOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error.message;
      toast("Error al crear rubro", {
        description: errorMessage,
      });
    },
  });

  const handleCreateCategory = async () => {
    if (!newCategory) return;

    try {
      await createCategoryMutation.mutateAsync({ newCategory });
      setNewCategory("");
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  if (isLoading) {
    return <Input placeholder="Buscando tus rubros..." disabled />;
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <select
        className="w-full border rounded px-2 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Sin Rubro</option>
        {categories.map((cat) => (
          <option key={cat.category_id} value={cat.category_id}>
            {cat.category_name}
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

      {/* Botón para crear nueva categoría */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">+ Nuevo</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear nuevo rubro</DialogTitle>
            <DialogDescription>
              Ingresá el nombre del nuevo rubro que quieras crear.
            </DialogDescription>
          </DialogHeader>

          <Input
            value={newCategory}
            disabled={createCategoryMutation.isLoading}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nombre del rubro"
          />

          <DialogFooter>
            <Button
              disabled={createCategoryMutation.isLoading}
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              disabled={createCategoryMutation.isLoading}
              onClick={handleCreateCategory}
            >
              {createCategoryMutation.isLoading ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
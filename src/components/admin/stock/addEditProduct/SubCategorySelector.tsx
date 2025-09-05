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
import { createSubCategory, getSubCategories } from "@/service/subCategories";
import type { SubCategory } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react"; // 👈 icono del tacho

interface SubCategorySelectProps {
  value: string;
  onChange: (id: string) => void;
  disabled: boolean;
}

export function SubCategorySelector({
  value,
  onChange,
  disabled,
}: SubCategorySelectProps) {
  const queryClient = useQueryClient();

  const { data: subCategories, isLoading: isLoading } = useQuery({
    queryKey: ["sub-categories"],
    queryFn: async () => {
      const response = await getSubCategories(role);
      return response.categories;
    },
  });

  const [newCategory, setNewCategory] = useState("");
  const [open, setOpen] = useState(false);

  const { role } = useAppSelector((state) => state.user);

  const createSubCategoryMutation = useMutation({
    mutationFn: async (data: { newCategory: string }) => {
      return await createSubCategory(data.newCategory, role);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sub-categories"] });
      onChange(data.sub_category_id);
      setOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error.message;
      toast("Error al crear categoría", {
        description: errorMessage,
      });
    },
  });

  const handleCreateCategory = async () => {
    if (!newCategory) return;

    try {
      await createSubCategoryMutation.mutateAsync({ newCategory });
      setNewCategory("");
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  if (isLoading) {
    return <Input placeholder="Buscando tus categorias..." disabled />;
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <select
        className="w-full border rounded px-2 py-2"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Sin Categoría</option>
        {subCategories.map((cat) => (
          <option key={cat.sub_category_id} value={cat.sub_category_id}>
            {cat.sub_category_name}
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
          <Button disabled={disabled} variant="outline">
            + Nuevo
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear nueva categoria</DialogTitle>
            <DialogDescription>
              Ingresá el nombre de la nueva categoría que quieras crear.
            </DialogDescription>
          </DialogHeader>

          <Input
            value={newCategory}
            disabled={createSubCategoryMutation.isLoading}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Sin Categoria"
          />

          <DialogFooter>
            <Button
              disabled={createSubCategoryMutation.isLoading}
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              disabled={createSubCategoryMutation.isLoading}
              onClick={handleCreateCategory}
            >
              {createSubCategoryMutation.isLoading ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

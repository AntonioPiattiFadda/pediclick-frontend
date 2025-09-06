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
import { createCategory, getCategories } from "@/service/categories";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CategorySelectProps {
  value: number | null;
  onChange: (id: number | null) => void;
  disabled: boolean;
}

export function CategorySelector({
  value,
  onChange,
  disabled,
}: CategorySelectProps) {
  const queryClient = useQueryClient();

  const { data: categories, isLoading: isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await getCategories(role);
      return response.categories;
    },
  });

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
        disabled={disabled}
        value={value === null ? "" : value}
        onChange={(e) =>
          onChange(e.target.value === "" ? 0 : Number(e.target.value))
        }
      >
        <option value={0}>Sin Rubro</option>
        {(categories ?? []).map((cat) => (
          <option key={cat.category_id} value={cat.category_id}>
            {cat.category_name}
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

      {/* Botón para crear nueva categoría */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button disabled={disabled} variant="outline">
            + Nuevo
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
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

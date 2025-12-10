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
import { createCategory, getCategories, updateCategory } from "@/service/categories";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { PlusCircle, X } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import type { Category } from "@/types/categories";
import { Label } from "@/components/ui/label";

// ---------- Context ----------
interface CategorySelectorContextType {
  value: number | null;
  onChange: (id: number | null) => void;
  disabled: boolean;
  categories: any[];
  isLoading: boolean;
}

const CategorySelectorContext =
  createContext<CategorySelectorContextType | null>(null);

function useCategorySelectorContext() {
  const ctx = useContext(CategorySelectorContext);
  if (!ctx)
    throw new Error("CategorySelector components must be used inside Root");
  return ctx;
}

// ---------- Root ----------
interface RootProps {
  value: number | null;
  onChange: (id: number | null) => void;
  disabled?: boolean;
  children: ReactNode;
}

const CategorySelectorRoot = ({ value, onChange, disabled = false, children }: RootProps) => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await getCategories();
      return response.categories;
    },
  });

  return (
    <CategorySelectorContext.Provider
      value={{
        value,
        onChange,
        disabled,
        categories: categories ?? [],
        isLoading,
      }}
    >
      <div className="flex items-center gap-2 w-full">{children}</div>
    </CategorySelectorContext.Provider>
  );
};

// ---------- Select ----------
const SelectCategory = () => {
  const { value, onChange, disabled, categories, isLoading } =
    useCategorySelectorContext();

  if (isLoading) {
    return <Input placeholder="Buscando tus rubros..." disabled />;
  }

  return (
    <>
      <select
        className={`w-full border border-gray-200 rounded px-2 py-2 ${disabled && "opacity-50 cursor-not-allowed"} text-gray-500`}
        disabled={disabled}
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : Number(e.target.value))
        }
      >
        <option value="">Sin Rubro</option>
        {(categories ?? []).map((cat) => (
          <option key={cat.category_id} value={cat.category_id}>
            {cat.category_name}
          </option>
        ))}
      </select>
    </>
  );
};

const CancelCategorySelection = () => {
  const { value, onChange } = useCategorySelectorContext();

  return (
    value && (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          onChange(null);
        }}
        className="text-red-500 hover:text-red-700 h-9"
      >
        <X className="w-5 h-5" />
      </Button>
    )
  );
};

// ---------- Create ----------
const CreateCategory = ({ isShortCut = false }: {
  isShortCut?: boolean;
}) => {
  const { onChange, disabled } = useCategorySelectorContext();
  const queryClient = useQueryClient();

  const [newCategory, setNewCategory] = useState("");
  const [open, setOpen] = useState(false);

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { newCategory: string }) => {
      return await createCategory(data.newCategory);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onChange(data.category_id);
      setOpen(false);
      setNewCategory("");
      if (isShortCut) {
        toast.success("Categoria creada");
      }
    },
    onError: (error: any) => {
      toast("Error al crear rubro", {
        description: error.message,
      });
    },
  });

  const handleCreateCategory = async () => {
    if (!newCategory) return;
    try {
      await createCategoryMutation.mutateAsync({ newCategory });
    } catch (err) {
      console.error("Error creating category:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isShortCut ?
          <SidebarMenuButton>Categoría</SidebarMenuButton> : <Button
            className="border border-gray-200"
            disabled={disabled}
            variant="outline"
          >
            <PlusCircle className="w-5 h-5" />
          </Button>}
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
  );
};


// ---------- Update ----------


const UpdateCategorySelection = () => {
  const {
    value: selectedCategoryId,
    onChange,
    disabled,
    categories,
  } = useCategorySelectorContext();

  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editedCategory, setEditedCategory] = useState<Category>({} as Category);

  //  Traigo la brand actual del selector

  const currentCategory = categories?.find(
    (c) => c.category_id === selectedCategoryId
  );

  console.log("Category List:", categories);
  console.log("Selected Category ID:", selectedCategoryId);
  console.log("Current Category:", currentCategory);


  //  Cada vez que cambia la brand seleccionada → precargo nombre

  useEffect(() => {
    if (currentCategory) setEditedCategory({
      ...(editedCategory ?? {}),
      category_name: currentCategory.category_name,
    });
  }, [currentCategory]);


  //  Mutación para update

  const updateCategoryMutation = useMutation({
    mutationFn: (data: { id: number; category_name: string; description: string; image_url: string; }) =>
      updateCategory(data.id, { category_name: data.category_name, description: data.description, image_url: data.image_url }),

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });

      onChange(data.category_id); // actualizar selector

      toast.success("Rubro actualizado correctamente");

      setOpen(false);
    },

    onError: (error: any) => {
      toast.error("Error al actualizar rubro", {
        description: error.message,
      });
    },
  });

  const handleUpdate = async () => {
    if (!editedCategory || !selectedCategoryId) return;

    await updateCategoryMutation.mutateAsync({
      id: Number(selectedCategoryId),
      category_name: editedCategory.category_name,
      description: editedCategory.description ?? "",
      image_url: editedCategory.image_url ?? "",
    });
  };

  // Si no hay brand seleccionada → no mostrar botón
  if (!selectedCategoryId) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="border border-gray-200"
          disabled={disabled}
          variant="outline"
        >
          Editar
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar rubro</DialogTitle>
          <DialogDescription>
            Modificá el rubro seleccionado.
          </DialogDescription>
        </DialogHeader>

        <Label>Nombre del rubro</Label>
        <Input
          value={editedCategory?.category_name || ""}
          disabled={updateCategoryMutation.isLoading}
          onChange={(e) => setEditedCategory({
            ...(editedCategory ?? {}),
            category_name: (e.target.value),
          })}
          placeholder="Nombre del rubro"
        />
        <Label>Descripción</Label>
        <Input
          value={editedCategory?.description || ""}
          disabled={updateCategoryMutation.isLoading}
          onChange={(e) => setEditedCategory({
            ...(editedCategory ?? {}),
            description: (e.target.value),
          })}
          placeholder="Descripción del rubro"
        />

        <Label>Imagen</Label>
        <Input
          value={editedCategory?.image_url || ""}
          disabled={updateCategoryMutation.isLoading}
          onChange={(e) => setEditedCategory({
            ...(editedCategory ?? {}),
            image_url: (e.target.value),
          })}
          placeholder="URL de la imagen del rubro"
        />

        <DialogFooter>
          <Button
            variant="outline"
            disabled={updateCategoryMutation.isLoading}
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>

          <Button
            disabled={updateCategoryMutation.isLoading}
            onClick={handleUpdate}
          >
            {updateCategoryMutation.isLoading ? "Editando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


// ---------- Compound export ----------
export {
  CategorySelectorRoot,
  SelectCategory,
  CreateCategory,
  UpdateCategorySelection,
  CancelCategorySelection
};

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
import { createCategory, getCategories } from "@/service/categories";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";

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
            + Nuevo
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

// ---------- Compound export ----------
export {
  CategorySelectorRoot,
  SelectCategory,
  CreateCategory,
  CancelCategorySelection
};

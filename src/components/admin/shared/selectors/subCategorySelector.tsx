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
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { createSubCategory, getSubCategories } from "@/service/subCategories";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

// ---------- Context ----------
interface SubCategorySelectorContextType {
  value: number | null;
  onChange: (id: number | null) => void;
  disabled: boolean;
  subCategories: any[];
  isLoading: boolean;
}

const SubCategorySelectorContext =
  createContext<SubCategorySelectorContextType | null>(null);

function useSubCategorySelectorContext() {
  const ctx = useContext(SubCategorySelectorContext);
  if (!ctx)
    throw new Error("SubCategorySelector components must be used inside Root");
  return ctx;
}

// ---------- Root ----------
interface RootProps {
  value: number | null;
  onChange: (id: number | null) => void;
  disabled?: boolean;
  children: ReactNode;
}

const SubCategorySelectorRoot = ({ value, onChange, disabled = false, children }: RootProps) => {
  const { data: subCategories, isLoading } = useQuery({
    queryKey: ["sub-categories"],
    queryFn: async () => {
      const response = await getSubCategories();
      return response.categories;
    },
  });

  return (
    <SubCategorySelectorContext.Provider
      value={{
        value,
        onChange,
        disabled,
        subCategories: subCategories ?? [],
        isLoading,
      }}
    >
      <div className="flex items-center gap-2 w-full">{children}</div>
    </SubCategorySelectorContext.Provider>
  );
};

// ---------- Select ----------
const SelectSubCategory = () => {
  const { value, onChange, disabled, subCategories, isLoading } =
    useSubCategorySelectorContext();

  if (isLoading) {
    return <Input placeholder="Buscando tus categorías..." disabled />;
  }

  return (
    <>
      <select
        className={`${disabled && "opacity-50 cursor-not-allowed"} w-full border border-gray-200 rounded px-2 py-2 text-gray-500`}
        disabled={disabled}
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : Number(e.target.value))
        }
      >
        <option value="">Sin Categoría</option>
        {(subCategories ?? []).map((cat) => (
          <option key={cat.sub_category_id} value={cat.sub_category_id}>
            {cat.sub_category_name}
          </option>
        ))}
      </select>

    
    </>
  );
};

const CancelSubCategorySelection = () => {
    const { value, onChange } = useSubCategorySelectorContext();

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
const CreateSubCategory = ({ isShortCut = false }: {
  isShortCut?: boolean;
}) => {
  const { onChange, disabled } = useSubCategorySelectorContext();
  const queryClient = useQueryClient();

  const [newSubCategory, setNewSubCategory] = useState("");
  const [open, setOpen] = useState(false);

  const createSubCategoryMutation = useMutation({
    mutationFn: async (data: { newSubCategory: string }) => {
      return await createSubCategory(data.newSubCategory);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sub-categories"] });
      onChange(data.sub_category_id);
      setOpen(false);
      setNewSubCategory("");
      if (isShortCut) {
        toast.success("Subcategoría creada");
      }
    },
    onError: (error: any) => {
      toast("Error al crear subcategoría", {
        description: error.message,
      });
    },
  });

  const handleCreateSubCategory = async () => {
    if (!newSubCategory) return;
    try {
      await createSubCategoryMutation.mutateAsync({ newSubCategory });
    } catch (err) {
      console.error("Error creating subcategory:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isShortCut ?
          <SidebarMenuButton>Subcategoría</SidebarMenuButton> : <Button
            className="border border-gray-200"
            disabled={disabled}
            variant="outline"
          >
            + Nuevo
          </Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear nueva subcategoría</DialogTitle>
          <DialogDescription>
            Ingresá el nombre de la nueva subcategoría que quieras crear.
          </DialogDescription>
        </DialogHeader>

        <Input
          value={newSubCategory}
          disabled={createSubCategoryMutation.isLoading}
          onChange={(e) => setNewSubCategory(e.target.value)}
          placeholder="Nombre de la subcategoría"
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
            onClick={handleCreateSubCategory}
          >
            {createSubCategoryMutation.isLoading ? "Creando..." : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ---------- Compound export ----------
export {
  SubCategorySelectorRoot,
  SelectSubCategory,
  CreateSubCategory,
  CancelSubCategorySelection
};

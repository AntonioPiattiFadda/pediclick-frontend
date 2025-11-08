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
import { createStore, getUserStores } from "@/service/stores";
import type { Store } from "@/types/stores";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarMenuButton } from "@/components/ui/sidebar";

// ---------- Context ----------
interface StoreSelectorContextType {
  value: number | null;
  onChange: (id: number | null) => void;
  disabled: boolean;
  stores: Store[];
  isLoading: boolean;
}

const StoreSelectorContext = createContext<StoreSelectorContextType | null>(
  null
);

function useStoreSelectorContext() {
  const ctx = useContext(StoreSelectorContext);
  if (!ctx) throw new Error("StoreSelector components must be used inside Root");
  return ctx;
}

// ---------- Root ----------
interface RootProps {
  value: number | null;
  onChange: (id: number | null) => void;
  disabled?: boolean;
  children: ReactNode;
}

const StoreSelectorRoot = ({ value, onChange, disabled = false, children }: RootProps) => {
  const { data: stores, isLoading } = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const response = await getUserStores();
      return response.stores;
    },
  });

  return (
    <StoreSelectorContext.Provider
      value={{ value, onChange, disabled, stores: stores ?? [], isLoading }}
    >
      <div className="flex items-center gap-2 w-full">{children}</div>
    </StoreSelectorContext.Provider>
  );
};

// ---------- Select ----------
const SelectStore = () => {
  const { value, onChange, disabled, stores, isLoading } =
    useStoreSelectorContext();

  if (isLoading) {
    return <Input placeholder="Buscando tus tiendas..." disabled />;
  }

  return (
    <>
      <Select
        disabled={disabled}
        value={value?.toString() ?? ""}
        onValueChange={(val) => onChange(val === "" ? null : Number(val))}
      >
        <SelectTrigger className="w-full border border-gray-200 text-gray-500">
          <SelectValue placeholder="Sin Tienda" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem disabled value="none">
            Sin Tienda
          </SelectItem>
          {(stores ?? []).map((cat) => (
            <SelectItem key={cat.store_id} value={cat.store_id.toString()}>
              {cat.store_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value && (
        <Button
          variant="ghost"
          disabled={disabled}
          size="icon"
          onClick={() => onChange(null)}
          className="text-red-500 hover:text-red-700"
        >
          <X className="w-5 h-5" />
        </Button>
      )}
    </>
  );
};

// ---------- Create ----------
const CreateStore = ({ isShortCut = false }: {
  isShortCut?: boolean;
}) => {
  const { onChange, disabled } = useStoreSelectorContext();
  const queryClient = useQueryClient();

  const [newStore, setNewStore] = useState("");
  const [open, setOpen] = useState(false);

  const createStoreMutation = useMutation({
    mutationFn: async (data: { newStore: string }) => {
      return await createStore({ store_name: data.newStore });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      const store = Array.isArray(data) ? data[0] : data;
      onChange(store?.store_id ?? null);
      setOpen(false);
      setNewStore("");
      if (isShortCut) {
        toast.success("Marca creada");
      }
    },
    onError: (error: {
      message: string
    }) => {
      toast("Error al crear tienda", {
        description: error.message,
      });
    },
  });

  const handleCreateStore = async () => {
    if (!newStore) return;
    try {
      await createStoreMutation.mutateAsync({ newStore });
    } catch (err) {
      console.error("Error creating store:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isShortCut ?
          <SidebarMenuButton>Tienda</SidebarMenuButton> : <Button
            className="border border-gray-200"
            disabled={disabled}
            variant="outline"
          >
            + Nuevo
          </Button>}
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
  );
};

// Remove compound export from this file.

// Export each component individually.
export { StoreSelectorRoot, SelectStore, CreateStore };

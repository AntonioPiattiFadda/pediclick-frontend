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
import { createProvider, getProviders } from "@/service/providers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { X } from "lucide-react";

// ---------- Context ----------
interface ProviderSelectorContextType {
  value: number | null;
  onChange: (id: number | null) => void;
  disabled: boolean;
  providers: any[];
  isLoading: boolean;
}

const ProviderSelectorContext =
  createContext<ProviderSelectorContextType | null>(null);

function useProviderSelectorContext() {
  const ctx = useContext(ProviderSelectorContext);
  if (!ctx)
    throw new Error("ProviderSelector components must be used inside Root");
  return ctx;
}

// ---------- Root ----------
interface RootProps {
  value: number | null;
  onChange: (id: number | null) => void;
  disabled?: boolean;
  children: ReactNode;
}

const ProviderSelectorRoot = ({ value, onChange, disabled = false, children }: RootProps) => {
  const { data: providers, isLoading } = useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const response = await getProviders();
      return response.providers;
    },
  });

  return (
    <ProviderSelectorContext.Provider
      value={{
        value,
        onChange,
        disabled,
        providers: providers ?? [],
        isLoading,
      }}
    >
      <div className="flex items-center gap-2 w-full">{children}</div>
    </ProviderSelectorContext.Provider>
  );
};

// ---------- Select ----------
const SelectProvider = () => {
  const { value, onChange, disabled, providers, isLoading } =
    useProviderSelectorContext();

  if (isLoading) {
    return <Input placeholder="Buscando tus proveedores..." disabled />;
  }

  return (
    <>
      <select
        className="w-full border border-gray-200 rounded px-2 py-2"
        value={value === null ? "" : value}
        disabled={disabled}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : Number(e.target.value))
        }
      >
        <option disabled value="">Sin Proveedor</option>
        {(providers ?? []).map((provider) => (
          <option className="cursor-pointer" key={provider.provider_id} value={provider.provider_id}>
            {provider.provider_name}
          </option>
        ))}
      </select>

      {value && (
        <Button
          variant="ghost"
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
const CreateProvider = () => {
  const { onChange, disabled } = useProviderSelectorContext();
  const queryClient = useQueryClient();

  const [newProvider, setNewProvider] = useState("");
  const [open, setOpen] = useState(false);

  const createProviderMutation = useMutation({
    mutationFn: async (data: { newProvider: string }) => {
      return await createProvider(data.newProvider);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      onChange(data.provider_id);
      setOpen(false);
      setNewProvider("");
    },
    onError: (error: any) => {
      toast("Error al crear proveedor", {
        description: error.message,
      });
    },
  });

  const handleCreateProvider = async () => {
    if (!newProvider) return;
    try {
      await createProviderMutation.mutateAsync({ newProvider });
    } catch (err) {
      console.error("Error creating provider:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="border border-gray-200" disabled={disabled} variant="outline">
          + Nuevo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
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
  );
};

// ---------- Compound export ----------
export {
  ProviderSelectorRoot,
  SelectProvider,
  CreateProvider,
};

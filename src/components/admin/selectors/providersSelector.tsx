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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { createProvider, getProviders } from "@/service/providers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, X } from "lucide-react";
import {
  createContext,
  useContext,
  useState,
  type ReactNode
} from "react";
import { Label } from "recharts";
import { toast } from "sonner";


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
      <div className="flex items-center gap-2 w-full h-10">{children}</div>
    </ProviderSelectorContext.Provider>
  );
};

// ---------- Select ----------
const SelectProvider = () => {
  const { value, onChange, disabled, providers, isLoading } =
    useProviderSelectorContext();

  const [shortCode, setShortCode] = useState<number | null>(null);

  const handleShortCodeMatch = (shortCode: number | null) => {
    if (shortCode === null) return;
    const matchedProvider = providers.find((p) => p.short_code === shortCode);
    if (matchedProvider) {
      onChange(matchedProvider.provider_id);
    } else {
      onChange(null);
      toast.error(`No se encontró ningún proveedor con el código ${shortCode}`);
    }
  }

  if (isLoading) {
    return <Input className="h-10" placeholder="Buscando tus proveedores..." disabled />;
  }

  return (
    <>

      <Input
        className={`border border-gray-200 h-9 w-22 `}
        value={shortCode === null ? "" : String(shortCode)}
        placeholder="Cód.."
        onChange={(e) => {
          const value = e.target.value;
          handleShortCodeMatch(Number(value) || null);
          setShortCode(Number(value) || null);
        }}
      />

      <Select
        disabled={disabled}
        value={value === null ? "" : String(value)}
        onValueChange={(val) => {
          onChange(val === "" ? null : Number(val));
          setShortCode(null);
        }}
      >
        <SelectTrigger className="h-11 w-full">
          <SelectValue placeholder="Seleccionar proveedor" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Proveedores</SelectLabel>
            {/* <SelectItem value="">Sin proveedor</SelectItem> */}
            {providers?.map((provider) => (
              <SelectItem key={provider.provider_id} value={String(provider.provider_id)}>
                {provider.provider_name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange(null)}
          className="text-red-500 hover:text-red-700 h-9"
        >
          <X className="w-5 h-5" />
        </Button>
      )}
    </>
  );
};

// ---------- Create ----------
const CreateProvider = ({ isShortCut = false }: {
  isShortCut?: boolean;
}) => {
  const { onChange, disabled } = useProviderSelectorContext();
  const queryClient = useQueryClient();

  const [newProvider, setNewProvider] = useState("");
  const [newProviderShortCode, setNewProviderShortCode] = useState("");
  const [open, setOpen] = useState(false);

  const createProviderMutation = useMutation({
    mutationFn: async (data: { newProvider: string, shortCode: string }) => {
      return await createProvider(data.newProvider, data.shortCode);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      onChange(data.provider_id);
      setOpen(false);
      setNewProvider("");
      if (isShortCut) {
        toast.success("Proveedor creado");
      }
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
      await createProviderMutation.mutateAsync({ newProvider, shortCode: newProviderShortCode });
    } catch (err) {
      console.error("Error creating provider:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isShortCut ?
          <SidebarMenuButton>Proveedor</SidebarMenuButton> : <Button
            className="border border-gray-200 h-9"
            disabled={disabled}
            variant="outline"
          >
            <PlusCircle />
          </Button>}
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

        <Label className="mt-2 mb-1">Código corto</Label>
        <Input
          value={newProviderShortCode}
          type="number"
          disabled={createProviderMutation.isLoading}
          onChange={(e) => setNewProviderShortCode(e.target.value)}
          placeholder="Código corto"
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
  CreateProvider, ProviderSelectorRoot,
  SelectProvider
};


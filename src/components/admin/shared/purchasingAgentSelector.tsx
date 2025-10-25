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
  createPurchasingAgent,
  getPurchasingAgents,
} from "@/service/purchasingAgents";
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
interface PurchasingAgentSelectorContextType {
  value: number | null;
  onChange: (id: number | null) => void;
  disabled: boolean;
  agents: any[];
  isLoading: boolean;
}

const PurchasingAgentSelectorContext =
  createContext<PurchasingAgentSelectorContextType | null>(null);

function usePurchasingAgentSelectorContext() {
  const ctx = useContext(PurchasingAgentSelectorContext);
  if (!ctx)
    throw new Error("PurchasingAgentSelector components must be used inside Root");
  return ctx;
}

// ---------- Root ----------
interface RootProps {
  value: number | null;
  onChange: (id: number | null) => void;
  disabled?: boolean;
  children: ReactNode;
}

const PurchasingAgentSelectorRoot = ({ value, onChange, disabled = false, children }: RootProps) => {
  const { data: agents, isLoading } = useQuery({
    queryKey: ["purchasing-agents"],
    queryFn: async () => {
      const response = await getPurchasingAgents();
      return response.purchasingAgents;
    },
  });

  return (
    <PurchasingAgentSelectorContext.Provider
      value={{
        value,
        onChange,
        disabled,
        agents: agents ?? [],
        isLoading,
      }}
    >
      <div className="flex items-center gap-2 w-full">{children}</div>
    </PurchasingAgentSelectorContext.Provider>
  );
};

// ---------- Select ----------
const SelectPurchasingAgent = () => {
  const { value, onChange, disabled, agents, isLoading } =
    usePurchasingAgentSelectorContext();

  if (isLoading) {
    return <Input placeholder="Buscando tus compradores..." disabled />;
  }

  return (
    <>
      <select
        className="w-full border border-gray-200 rounded px-2 py-2"
        disabled={disabled}
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : Number(e.target.value))
        }
      >
        <option disabled value="">Sin Comprador</option>
        {(agents ?? []).map((agent) => (
          <option key={agent.purchasing_agent_id} value={agent.purchasing_agent_id}>
            {agent.purchasing_agent_name}
          </option>
        ))}
      </select>

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
const CreatePurchasingAgent = () => {
  const { onChange, disabled } = usePurchasingAgentSelectorContext();
  const queryClient = useQueryClient();

  const [newPurchasingAgent, setNewPurchasingAgent] = useState("");
  const [open, setOpen] = useState(false);

  const createPurchasingAgentMutation = useMutation({
    mutationFn: async (data: { newPurchasingAgent: string }) => {
      return await createPurchasingAgent(data.newPurchasingAgent);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["purchasing-agents"] });
      onChange(data.purchasing_agent_id);
      setOpen(false);
      setNewPurchasingAgent("");
    },
    onError: (error: any) => {
      toast("Error al crear agente de compra", {
        description: error.message,
      });
    },
  });

  const handleCreatePurchasingAgent = async () => {
    if (!newPurchasingAgent) return;
    try {
      await createPurchasingAgentMutation.mutateAsync({ newPurchasingAgent });
    } catch (err) {
      console.error("Error creating purchasing agent:", err);
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
          <DialogTitle>Crear nuevo comprador</DialogTitle>
          <DialogDescription>
            Ingresá el nombre del nuevo comprador que quieras crear.
          </DialogDescription>
        </DialogHeader>

        <Input
          value={newPurchasingAgent}
          disabled={createPurchasingAgentMutation.isLoading}
          onChange={(e) => setNewPurchasingAgent(e.target.value)}
          placeholder="Nombre del comprador"
        />

        <DialogFooter>
          <Button
            disabled={createPurchasingAgentMutation.isLoading}
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            disabled={createPurchasingAgentMutation.isLoading}
            onClick={handleCreatePurchasingAgent}
          >
            {createPurchasingAgentMutation.isLoading ? "Creando..." : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ---------- Compound export ----------
export {
  PurchasingAgentSelectorRoot,
  SelectPurchasingAgent,
  CreatePurchasingAgent,
};

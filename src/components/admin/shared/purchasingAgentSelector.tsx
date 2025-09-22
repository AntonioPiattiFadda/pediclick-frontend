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
import { createPurchasingAgent, getPurchasingAgents } from "@/service/purchasingAgents";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PurchasingAgentProps {
  value: number | null;
  onChange: (id: number | null) => void;
  disabled: boolean;
}

export function PurchasingAgentSelector({
  value,
  onChange,
  disabled,
}: PurchasingAgentProps) {
  const queryClient = useQueryClient();

  const { data: purchasingAgents, isLoading: isLoading } = useQuery({
    queryKey: ["purchasing-agents"],
    queryFn: async () => {
      const response = await getPurchasingAgents();
      return response.purchasingAgents;
    },
  });

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
    },
    onError: (error: any) => {
      const errorMessage = error.message;
      toast("Error al crear agente de compra", {
        description: errorMessage,
      });
    },
  });

  const handleCreatePurchasingAgent = async () => {
    if (!newPurchasingAgent) return;

    try {
      await createPurchasingAgentMutation.mutateAsync({ newPurchasingAgent });
      setNewPurchasingAgent("");
    } catch (error) {
      console.error("Error creating purchasing agent:", error);
    }
  };

  if (isLoading) {
    return <Input placeholder="Buscando tus compradores..." disabled />;
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
        <option value={0}>Sin Comprador</option>
        {(purchasingAgents ?? []).map((agent) => (
          <option key={agent.purchasing_agent_id} value={agent.purchasing_agent_id}>
            {agent.purchasing_agent_name}
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

      {/* Botón para crear nuevo comprador */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button disabled={disabled} variant="outline">
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
    </div>
  );
}

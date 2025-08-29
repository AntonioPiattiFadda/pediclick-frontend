/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface DeleteTableElementPopUpProps {
  elementId: number | string;
  queryKey: string[];
  deleteFn: (id: number | string) => Promise<any>;
  elementName?: string;
  size?: "sm" | "default" | "lg" | "icon";
  successMsgTitle?: string;
  successMsgDescription?: string;
  errorMsgTitle?: string;
  errorMsgDescription?: string;
}

export function DeleteTableElementPopUp({
  elementId,
  queryKey,
  deleteFn,
  elementName,
  size = "icon",
  successMsgTitle,
  successMsgDescription,
  errorMsgTitle,
  errorMsgDescription
}: DeleteTableElementPopUpProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number | string) => {
      return await deleteFn(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setOpen(false);
      toast(successMsgTitle, {
        description:  successMsgDescription,
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || errorMsgDescription;
      toast(errorMsgTitle, {
        description: errorMessage,
      });
    },
  });

  const handleDelete = async () => {
    try {
      await deleteProductMutation.mutateAsync(elementId);
    } catch (error) {
      console.error("Error deleting element:", error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="text-red-500 hover:text-red-700"
          disabled={deleteProductMutation.isLoading}
        >
          <Trash2 className="w-4 h-4" />
          {size !== "icon" && " Eliminar"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Eliminar producto</h4>
            <p className="text-sm text-muted-foreground">
              Esta acción es irreversible.{" "}
              {elementName &&
                `¿Estás seguro de que querés eliminar "${elementName}"?`}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={deleteProductMutation.isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteProductMutation.isLoading}
            >
              {deleteProductMutation.isLoading ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export function DeleteTableElement({
  id,
  endpoint,
  queryKey,
}: {
  id: string;
  endpoint: (id: string) => Promise<void>;
  queryKey: string[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const deleteTableElement = useMutation({
    mutationFn: async () => {
      return await endpoint(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
      setIsModalOpen(false);
      toast("Miembro de equipo eliminado exitosamente", {
        description: "El miembro de equipo ha sido eliminado correctamente.",
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message;
      setErrorMessage(errorMessage);
      setTimeout(() => {
        setErrorMessage(null);
      }, 3000);
    },
  });

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
      
          Eliminar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
        <DialogHeader className="reliative">
          <DialogTitle>Estas seguro?</DialogTitle>
          <DialogDescription>
            Esta accion no se puede deshacer. Esto eliminara los datos de este
            miembro del equipo.
          </DialogDescription>
           {errorMessage && (
            <div className="mt-2 text-sm text-red-500 absolute bottom-8">
              {errorMessage}
            </div>
          )}
        </DialogHeader>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button
              disabled={deleteTableElement.isLoading}
              variant="ghost"
            //   onClick={resetForm}
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            disabled={deleteTableElement.isLoading}
            variant={'destructive'}
            // onClick={handleSubmit}
          >
            {deleteTableElement.isLoading
              ? "Eliminando..."
              : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

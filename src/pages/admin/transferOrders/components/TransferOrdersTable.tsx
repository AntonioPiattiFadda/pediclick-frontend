import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/utils";
import { useNavigate } from "react-router-dom";
import { DeleteTableElementPopUp } from "../../../../components/admin/shared/deleteTableElementPopUp";
// import { deleteTransferOrder } from "@/service/transferOrders";
import { transferOrderStatuses } from "@/constants";
import { deleteTransferOrder } from "@/service/transferOrders";
import type { TransferOrderType } from "@/types/transferOrders";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Eye, Truck } from "lucide-react";
import { toast } from "sonner";

interface TransferOrdersTableProps {
  transferOrders: TransferOrderType[];
}

export const TransferOrdersTable = ({ transferOrders }: TransferOrdersTableProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deleteOrderMutation = useMutation({
    mutationFn: (id: string | number) => deleteTransferOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfer-orders"] });
      toast("Orden eliminada", {
        description: "La orden se eliminó correctamente.",
      });

    },
    onError: () => {
      toast("Error al eliminar la orden", {
        description: "Intentá nuevamente más tarde.",
      });
    },
  });



  return (
    <div className="rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Desde</TableHead>
            <TableHead>Hasta</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Asignado a</TableHead>
            <TableHead>Creada</TableHead>
            <TableHead className="text-end">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transferOrders.length > 0 ? (
            transferOrders.map((to) => {
              const isCompleted = to.status === "COMPLETED";

              return (<TableRow key={to.transfer_order_id}>

                <TableCell>{to.from_location?.name ?? "--"}</TableCell>
                <TableCell>{to.to_location?.name ?? "--"}</TableCell>
                <TableCell>{transferOrderStatuses[to.status] ?? "--"}</TableCell>
                <TableCell>{to.assigned_user?.full_name ?? "--"}</TableCell>
                <TableCell>{formatDate(to?.created_at ?? "--") || "--"}</TableCell>
                <TableCell>

                </TableCell>
                <TableCell className="flex gap-2">
                  {isCompleted ?
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/transfer-orders/${to.transfer_order_id}?readOnly=true`)}
                    >
                      <Eye />
                    </Button> : (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/transfer-orders/${to.transfer_order_id}?editing=true`)}
                        >
                          <Edit />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/transfer-orders/${to.transfer_order_id}?transferring=true`)}
                        >
                          <Truck />
                        </Button>
                      </>
                    )}
                  <DeleteTableElementPopUp
                    elementId={to.transfer_order_id}
                    elementName={to.transfer_order_id?.toString()}
                    deleteFn={async (id: string | number) => {
                      await deleteOrderMutation.mutateAsync(id);

                    }}
                    queryKey={["transfer-orders"]}
                    successMsgTitle="Transferencia eliminada"
                    successMsgDescription="La transferencia ha sido eliminada correctamente."
                    errorMsgTitle="Error al eliminar transferencia"
                    errorMsgDescription="No se pudo eliminar la transferencia."
                  />

                </TableCell>
              </TableRow>)
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                No tienes transferencias
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

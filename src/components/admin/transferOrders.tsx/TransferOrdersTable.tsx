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
import { DeleteTableElementPopUp } from "../shared/deleteTableElementPopUp";
// import { deleteTransferOrder } from "@/service/transferOrders";
import { transferOrderStatuses } from "@/constants";
import { deleteTransferOrder } from "@/service/transferOrders";
import type { TransferOrderType } from "@/types/transferOrders";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Tractor } from "lucide-react";
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
              const fromLocationType = to.from_store_id ? "STORE" : "STOCK_ROOM";
              const fromLocationId =
                fromLocationType === "STORE" ? to.from_store_id : to.from_stock_room_id;

              const toLocationType = to.to_store_id ? "STORE" : "STOCK_ROOM";
              const toLocationId =
                toLocationType === "STORE" ? to.to_store_id : to.to_stock_room_id;
              return (<TableRow key={to.transfer_order_id}>

                <TableCell>{fromLocationId ?? "--"}</TableCell>
                <TableCell>{toLocationId ?? "--"}</TableCell>
                <TableCell>{transferOrderStatuses[to.transfer_order_status] ?? "--"}</TableCell>
                <TableCell>{to.assigned_user_id ?? "--"}</TableCell>
                <TableCell>{formatDate(to?.created_at ?? "--") || "--"}</TableCell>
                <TableCell>

                </TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/transfer-orders/${to.transfer_order_id}?updating=true`)}
                  >
                    <Edit />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/transfer-orders/${to.transfer_order_id}?transferring=true`)}
                  >
                    <Tractor />
                  </Button>
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

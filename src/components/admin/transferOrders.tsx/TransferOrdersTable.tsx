import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteTableElementPopUp } from "../shared/deleteTableElementPopUp";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/utils";
// import { deleteTransferOrder } from "@/service/transferOrders";
import { transferOrderStatuses } from "@/constants";
import type { TransferOrderType } from "@/types/transferOrders";

interface TransferOrdersTableProps {
  transferOrders: TransferOrderType[];
}

export const TransferOrdersTable = ({ transferOrders }: TransferOrdersTableProps) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Acciones</TableHead>
            <TableHead>ID transferencia</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Asignado a</TableHead>
            <TableHead>Creada</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transferOrders.length > 0 ? (
            transferOrders.map((to) => (
              <TableRow key={to.transfer_order_id}>
                <TableCell>
                  <DeleteTableElementPopUp
                    elementId={to.transfer_order_id}
                    elementName={to.transfer_order_id?.toString()}
                    deleteFn={async (id: string | number) => {
                      // await deleteTransferOrder(id);
                      // return { success: true };
                    }}
                    queryKey={["transfer-orders"]}
                    successMsgTitle="Transferencia eliminada"
                    successMsgDescription="La transferencia ha sido eliminada correctamente."
                    errorMsgTitle="Error al eliminar transferencia"
                    errorMsgDescription="No se pudo eliminar la transferencia."
                  />
                </TableCell>
                <TableCell>{to.transfer_order_id ?? "--"}</TableCell>
                <TableCell>{transferOrderStatuses[to.transfer_order_status] ?? "--"}</TableCell>
                <TableCell>{to.assigned_user_id ?? "--"}</TableCell>
                <TableCell>{formatDate(to?.created_at ?? "--") || "--"}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/transfer-orders/${to.transfer_order_id}`)}
                  >
                    Ver transferencia
                  </Button>
                </TableCell>
              </TableRow>
            ))
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

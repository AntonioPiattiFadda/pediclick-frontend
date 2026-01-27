import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// import { EditTeamMemberBtn } from "./EditTeamMemberBtn";
import type { LoadOrder } from "@/types/loadOrders";
import { DeleteTableElementPopUp } from "../../../../components/admin/deleteTableElementPopUp";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/utils";
import MainTablePagination from "@/components/admin/mainTablePagination/MainTablePagination";
import type { PaginationType } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { deleteLoadOrder } from "@/service/loadOrders";

interface LoadOrdersTableProps {
  loadOrders: LoadOrder[];
  onChangePagination: (pagination: PaginationType) => void;
  pagination: PaginationType;
  isLoading: boolean;
}

export const LoadOrdersTable = ({ loadOrders, onChangePagination, pagination, isLoading }: LoadOrdersTableProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Acciones</TableHead>
            <TableHead>Nro de remito</TableHead>
            <TableHead>Nro de factura</TableHead>

            <TableHead>Proveedor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>

          <TableRow>
            <TableCell colSpan={6} className="text-center">
              <Spinner className="mx-auto my-4" />
            </TableCell>
          </TableRow>

        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={6}>
              <MainTablePagination
                pagination={pagination}
                onChangePagination={onChangePagination}
                disabled={(loadOrders?.length ?? 0) < pagination.pageSize || isLoading}
              />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  }

  return (
    <div className="rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Acciones</TableHead>
            <TableHead>Nro de remito</TableHead>
            <TableHead>Nro de factura</TableHead>

            <TableHead>Proveedor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loadOrders.length > 0 ? (
            loadOrders.map((loadOrder) => (
              <TableRow key={loadOrder.load_order_id}>
                <TableCell>
                  {" "}
                  {/* < id={member.id} />{" "} */}
                  <DeleteTableElementPopUp
                    elementId={loadOrder.load_order_id!}
                    elementName={
                      loadOrder?.load_order_number?.toString() ?? "Remito"
                    }
                    deleteFn={async (id: string | number) => {
                      await deleteLoadOrder(Number(id));
                    }}
                    queryKey={["load-orders"]}
                    successMsgDescription="El remito ha sido eliminado correctamente."
                    errorMsgDescription="No se pudo eliminar el remito."
                  />
                </TableCell>
                <TableCell>{loadOrder.load_order_number || "--"}</TableCell>
                <TableCell>{loadOrder.invoice_number || "--"}</TableCell>
                <TableCell>
                  {loadOrder.providers?.provider_name || "--"}
                </TableCell>
                <TableCell>
                  {formatDate(loadOrder?.created_at ?? "--") || "--"}
                </TableCell>
                <TableCell>
                  <Button variant="outline" onClick={() => { navigate(`/load-orders/${loadOrder.load_order_id}`) }} >
                    Ver remito
                  </Button>
                </TableCell>
                {/* <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        className="object-cover"
                        src={
                          member.avatar_url
                            ? member.avatar_url
                            : "/default-avatar.png"
                        }
                        alt={member.full_name}
                      />
                      <AvatarFallback>
                        {member.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                     <p className="font-medium">{member.name}</p> 
                      <p className="text-sm text-muted-foreground">
                         {member.sku} 
                      </p>
                    </div>
                  </div>
                </TableCell> */}
                {/* <TableCell>{member.full_name}</TableCell>
                <TableCell>{member.email}</TableCell> */}
                {/* <TableCell>
                  {ROLES.find((role) => role.value === member.role)?.label}
                </TableCell> */}
                {/* <TableCell>
                  {
                    userStores.find(
                      (store) => store.store_id === member.store_id
                    )?.store_name
                  }
                </TableCell> */}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                No tienes remitos cargados
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={6}>
              <MainTablePagination
                pagination={pagination}
                onChangePagination={onChangePagination}
                disabled={(loadOrders?.length ?? 0) < pagination.pageSize}
              />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

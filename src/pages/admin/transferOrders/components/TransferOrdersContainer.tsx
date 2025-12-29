import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createTransferOrder, getAllTransferOrders } from "@/service/transferOrders";
import type { TransferOrderType } from "@/types/transferOrders";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TransferOrdersTable } from "./TransferOrdersTable";
import { LocationSelectorRoot, SelectLocation } from "../../../../components/admin/selectors/locationSelector";
import type { Location } from "@/types/locations";
import { toast } from "sonner";
import TableSkl from "@/components/ui/skeleton/tableSkl";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const TransferOrdersContainer = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [fromLocationId, setFromLocationId] = useState<Pick<Location, 'location_id' | 'name' | 'type'> | null>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10
  })

  const {
    data: dbTransferOrders,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["transfer-orders", pagination.page, pagination.pageSize],
    queryFn: async () => {
      const response = await getAllTransferOrders(pagination.page, pagination.pageSize);
      return response.dbTransferOrders as TransferOrderType[];
    },
  });

  const createMutation = useMutation<TransferOrderType, unknown, void>({
    mutationFn: async () => {
      const location = {
        from_location_id: fromLocationId?.location_id || null
      };
      return await createTransferOrder(location);
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["transfer-orders", pagination.page, pagination.pageSize] });
      const id = created?.transfer_order_id;
      if (id) navigate(`/transfer-orders/${id}`);
    },
    onError: (error) => {
      console.error("Error creating transfer order:", error);
      toast.error("Error al crear la orden de transferencia. Inténtalo de nuevo.");
    },
  });

  if (isLoading) return <TableSkl />;
  if (isError) return <TableSkl />;



  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Transferencias</CardTitle>
              <CardDescription>Gestiona tus órdenes de transferencia</CardDescription>
            </div>
            <div className="grid grid-cols-[2fr_1fr] gap-4 w-[500px]">

              <LocationSelectorRoot
                value={fromLocationId}
                onChange={setFromLocationId}>
                <SelectLocation />
                {/* <CreateLocation /> */}
              </LocationSelectorRoot>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isLoading || !fromLocationId}
              >
                {createMutation.isLoading ? "Creando..." : "Nueva transferencia"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <TransferOrdersTable transferOrders={dbTransferOrders ?? []} />
        </CardContent>
        <CardFooter className="flex justify-end">
          <div className="p-2 flex justify-end items-center gap-2">
            {/* Pagination Controls could go here */}
            <Button size={'icon'}
              disabled={pagination.page === 1}
              onClick={() => setPagination((prev) => ({
                ...prev,
                page: Math.max(prev.page - 1, 1),
              }))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>
              Página {pagination.page}
            </span>
            <Button
              size={'icon'}
              disabled={dbTransferOrders.length < pagination.pageSize}
              onClick={() => setPagination((prev) => ({
                ...prev,
                page: prev.page + 1,
              }))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

        </CardFooter>
      </Card>
    </div>
  );
};

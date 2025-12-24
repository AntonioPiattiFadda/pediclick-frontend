import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createTransferOrder, getAllTransferOrders } from "@/service/transferOrders";
import type { TransferOrderType } from "@/types/transferOrders";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TransferOrdersTable } from "./TransferOrdersTable";
import { LocationSelectorRoot, SelectLocation } from "../../../../components/admin/shared/selectors/locationSelector";
import type { Location } from "@/types/locations";
import { toast } from "sonner";
import TableSkl from "@/components/ui/skeleton/tableSkl";

export const TransferOrdersContainer = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [fromLocationId, setFromLocationId] = useState<Pick<Location, 'location_id' | 'name' | 'type'> | null>(null);

  const {
    data: dbTransferOrders,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["transfer-orders"],
    queryFn: async () => {
      const response = await getAllTransferOrders();
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
      queryClient.invalidateQueries({ queryKey: ["transfer-orders"] });
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
      </Card>
    </div>
  );
};

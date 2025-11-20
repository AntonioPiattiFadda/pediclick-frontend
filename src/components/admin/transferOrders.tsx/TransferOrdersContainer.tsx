import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import TableSkl from "../sellPoints/ui/tableSkl";
import { TransferOrdersTable } from "./TransferOrdersTable";
import { createTransferOrder, getAllTransferOrders } from "@/service/transferOrders";
import { useState } from "react";
import type { TransferOrderType } from "@/types/transferOrders";
import LocationsSelector from "../transferOrder/LocationSelector";

export const TransferOrdersContainer = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [selectedLocationType, setSelectedLocationType] = useState<string | null>(null);

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
        from_store_id: selectedLocationType === "STORE" ? selectedLocationId : null,
        from_stock_room_id:
          selectedLocationType === "STOCK_ROOM" ? selectedLocationId : null,
      };
      return await createTransferOrder(location);
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["transfer-orders"] });
      const id = created?.transfer_order_id;
      if (id) navigate(`/transfer-orders/${id}`);
    },
  });

  if (isLoading) return <TableSkl />;
  if (isError) return <TableSkl />;

  const formattedFromId =
    selectedLocationType === "STORE"
      ? `store-${selectedLocationId}`
      : `stock-${selectedLocationId}`

  const fromId = selectedLocationId ? formattedFromId : '';

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
              <LocationsSelector
                onChangeSelectedLocation={(newLocationId, locationType) => {
                  setSelectedLocationId(newLocationId);
                  setSelectedLocationType(locationType);
                }}
                selectedLocationId={fromId}
                label="Desde"
                placeholder="Seleccionar ubicación"
              />
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isLoading || !selectedLocationId}
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

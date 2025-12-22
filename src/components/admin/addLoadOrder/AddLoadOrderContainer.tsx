import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GetFollowingLoadOrderNumberBtn from "@/components/unassigned/getFollowingLoadOrderNumberBtn";
import { createLoadOrder } from "@/service/loadOrders";
import type { LoadOrder } from "@/types/loadOrders";
import type { LotContainersStock } from "@/types/lotContainersStock";
import type { Lot } from "@/types/lots";
import type { Stock } from "@/types/stocks";
import { updateLotWithCalculations } from "@/utils/lots";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { CreateProvider, ProviderSelectorRoot, SelectProvider } from "../shared/selectors/providersSelector";
import { AddLoadOrderTable } from "./AddLoadOrderTable";
import { emptyLoadOrder } from "./emptyFormData";

export const AddLoadOrderContainer = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<LoadOrder>(emptyLoadOrder);

  const [lots, setLots] = useState<Lot[]>([]);
  const [stock] = useState<Stock[]>([]);

  const [lotContainersStock] = useState<LotContainersStock[]>([]);

  const createLoadOrderMutation = useMutation({
    mutationFn: async () => {

      return await createLoadOrder(formData, lots, stock, lotContainersStock);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["load-orders"] });
      setFormData(emptyLoadOrder);
      navigate("/load-orders");
    },
    onError: (error) => {
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: unknown }).message)
          : "Error desconocido";
      toast.error("Error al crear el remito: " + errorMessage);
    },
  });

  // Sum of download_total_cost across all lots (used to show on the load order)
  const computeTotalDownloadCost = (
    lots: { download_total_cost: number | null | undefined }[]
  ) => {
    return lots.reduce(
      (sum, l) => sum + (Number(l?.download_total_cost) || 0),
      0
    );
  };

  const handleCreateLoadOrder = async () => {

    if (!formData) return;

    try {
      await createLoadOrderMutation.mutateAsync();
    } catch (error) {
      console.error("Error creating load order:", error);
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Remito</CardTitle>
              <CardDescription>Gestiona tu remito</CardDescription>
            </div>

            <div className="flex  gap-2 ">
              <Label htmlFor="expiration_date">Fecha</Label>

              <Input
                placeholder="Fecha de entrega"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                value={formData.delivery_date}
                onChange={(e) =>
                  setFormData({ ...formData, delivery_date: e.target.value })
                }
              />
            </div>

          </div>
        </CardHeader>
        <CardContent className="space-y-4 grid grid-cols-8 gap-4">
          <div className="flex flex-col gap-2 ">
            <Label htmlFor="expiration_date">Número de remito</Label>
            <div className="grid grid-cols-[1fr_50px] gap-2">

              <Input
                type="number"
                name="load_order_number"
                value={formData.load_order_number ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    load_order_number:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
              <GetFollowingLoadOrderNumberBtn onClick={(nextLoadOrderNumber) => {
                setFormData({
                  ...formData,
                  load_order_number: nextLoadOrderNumber,
                });
              }} />
            </div>
          </div>


          <div className="flex flex-col gap-2 -mt-2 col-span-2">
            <Label className="mt-2">Proveedor</Label>
            <ProviderSelectorRoot
              value={formData.provider_id}
              onChange={(value) =>
                setFormData({ ...formData, provider_id: value })
              }
              disabled={false}>
              <SelectProvider />
              <CreateProvider />
            </ProviderSelectorRoot>

          </div>

          {/* <div className="flex flex-col gap-2 -mt-2">
            <Label className="mt-2">Comprador</Label>
            <PurchasingAgentSelectorRoot value={formData.purchasing_agent_id}
              onChange={(value) =>
                setFormData({ ...formData, purchasing_agent_id: value })
              }
              disabled={false}>
              <SelectPurchasingAgent />
              <CreatePurchasingAgent />
            </PurchasingAgentSelectorRoot>

          </div> */}




          <div className="flex flex-col gap-2 col-span-2">
            <Label htmlFor="max">Número de factura AFIP</Label>
            <Input
              id="max"
              type="number"
              value={formData.invoice_number ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  invoice_number: Number(e.target.value),
                })
              }
            />
          </div>

          <div className="flex flex-col gap-2 relative col-span-4">
            <Label className="mt-2 absolute -top-4">Transporte</Label>
            <div className="grid grid-cols-4 gap-4 mt-3">
              <div>
                <Label className="text-xs" htmlFor="company">
                  Compania
                </Label>
                <Input
                  id="company"
                  type="string"
                  value={formData.transporter_data.delivery_company ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      transporter_data: {
                        ...formData.transporter_data,
                        delivery_company: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div>
                <Label className="text-xs" htmlFor="min">
                  Nombre
                </Label>
                <Input
                  id="min"
                  type="string"
                  value={formData.transporter_data.name ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      transporter_data: {
                        ...formData.transporter_data,
                        name: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div>
                <Label className="text-xs" htmlFor="licence_plate">
                  Patente
                </Label>
                <Input
                  id="max"
                  type="string"
                  value={formData.transporter_data.licence_plate ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      transporter_data: {
                        ...formData.transporter_data,
                        licence_plate: e.target.value,
                      },
                    })
                  }
                />
              </div>

              {/* <div>
                <Label className="text-xs" htmlFor="licence_plate">
                  Precio
                </Label>
                <Input
                  id="max"
                  type="number"
                  value={formData.delivery_price ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      delivery_price: Number(e.target.value),
                    })
                  }
                />
              </div> */}
            </div>
          </div>

          {/* <div className="flex flex-col gap-2 ">
            <Label>Total descarga (lotes)</Label>
            <Input
              type="number"
              value={formData.total_download_cost ?? 0}
              readOnly
            />
          </div> */}
          {/* <div className="flex flex-col gap-2 ">
            <Label htmlFor="max">Precio del transporte</Label>
            <Input
              id="max"
              type="number"
              value={formData.delivery_price}
              onChange={(e) =>
                setFormData({ ...formData, delivery_price: e.target.value })
              }
            />
          </div> */}
        </CardContent>
        <CardContent>
          <AddLoadOrderTable
            loadOrderLots={lots}
            onAddElementToLoadOrder={(newLot, newStock, newLotContainersLocation) => {
              const lotId = Math.random();
              console.log('Generated lotId', lotId);
              console.log('newLot', newLot);
              console.log('newStock', newStock);
              console.log('newLotContainersLocation', newLotContainersLocation);

              //Hay que calcular el unassigned aca porque lo hace el otro componente al agregar stock.
              const newLots = [...lots, { ...newLot, lot_id: lotId }];
              setLots(newLots);
              // setStock((prevStock) => [...prevStock, ...newStock]);
              // setLotContainersStock((prevLocations) => [...prevLocations, ...newLotContainersLocation]);
            }}
            onUpdateLot={(index, patch) => {
              const prevLots = lots ?? [];
              const current = prevLots[index];
              if (!current) return;
              const updated = updateLotWithCalculations(current, patch);
              prevLots[index] = updated;
              const totalDownload = computeTotalDownloadCost(prevLots);
              setLots(prevLots);
              setFormData({
                ...formData,
                total_download_cost: totalDownload,
              });

            }}
            onDeleteLot={(index) => {
              const newLots = lots.filter((_, i) => i !== index);
              const totalDownload = computeTotalDownloadCost(newLots);
              setLots(newLots);
              setFormData({
                ...formData,
                total_download_cost: totalDownload,
              });
            }}
          />
        </CardContent>

        <CardFooter>
          <Button
            disabled={
              !lots ||
              lots.length === 0 ||
              createLoadOrderMutation.isLoading
            }
            onClick={handleCreateLoadOrder}
            className="ml-auto"
          >
            {createLoadOrderMutation.isLoading
              ? "Creando remito..."
              : "Crear remito"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

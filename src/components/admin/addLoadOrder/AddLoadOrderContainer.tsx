import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import TableSkl from "../sellPoints/ui/tableSkl";
import { adaptLoadOrderForSubmission } from "@/adapters/loadOrders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppSelector } from "@/hooks/useUserData";
import { createLoadOrder } from "@/service/loadOrders";
import { getProviders } from "@/service/providers";
import type { LoadOrder } from "@/types/loadOrders";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ProviderSelector } from "../stock/addEditProduct/ProvidersSelector";
import { AddLoadOrderTable } from "./AddLoadOrderTable";
import { emptyLoadOrder } from "./emptyFormData";
import { PurchasingAgentSelector } from "../shared/purchasingAgentSelector";

export const AddLoadOrderContainer = () => {
  const queryClient = useQueryClient();

  const { role } = useAppSelector((state) => state.user);
  const [formData, setFormData] = useState<LoadOrder>(emptyLoadOrder);

  console.log("Form data:", formData);
  const navigator = useNavigate();

  const { data: providers, isLoading: isLoadingProviders } = useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const response = await getProviders(role);
      return response.providers;
    },
  });

  // TODO Falta asignTo y receptor_id
  //TODO FALTA RENDIMIENTO Y COMISION

  const createLoadOrderMutation = useMutation({
    mutationFn: async (data: LoadOrder) => {
      console.log("Creating load order with data:", data);
      const { loadOrder, lots, prices } = adaptLoadOrderForSubmission(data);
      return await createLoadOrder(role, loadOrder, lots, prices);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["load-orders"] });
      // navigator("/load-orders");
    },
    onError: (error) => {
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: unknown }).message)
          : "Error desconocido";
      toast("Error al crear el remito", {
        description: errorMessage,
      });
    },
  });

  const handleCreateLoadOrder = async () => {
    //TODO Validar
    //TODO separar los elementos para apuntar a las funciones lo que seria adaptar
    //TODO Crear el remito en el backend
    console.log("Submitting form data:", formData);
    if (!formData) return;

    try {
      await createLoadOrderMutation.mutateAsync(formData);
      setFormData(emptyLoadOrder);
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
            {/* <div className="absolute w-screen h-screen top-0 left-0 flex items-center justify-center bg-red-200 z-50">
              <div className="flex flex-col gap-2 col-span-2 bg-white w-[1200px] h-[650px] ">
                <Label htmlFor="lot_number">Precios</Label>
                <PricesSelectorV2
                  value={lotPrices}
                  onChange={(prices) => setLotPrices(prices)}
                  lotId={null}
                  disabled={false}
                />
              </div>
            </div> */}
            {/* <div className="flex flex-col sm:flex-row gap-2">
              <AddLoadOrderBtn />
            </div> */}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 grid grid-cols-4 gap-4">
          <div className="flex flex-col gap-2 ">
            <Label htmlFor="expiration_date">Número de remito</Label>
            <Input
              type="number"
              name="load_order_number"
              value={formData.load_order_number}
              onChange={(e) =>
                setFormData({ ...formData, load_order_number: e.target.value })
              }
            />
          </div>

          <div className="flex flex-col gap-2 ">
            <Label htmlFor="expiration_date">Fecha de entrega</Label>

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

          <div className="flex flex-col gap-2 -mt-2">
            <Label className="mt-2">Proveedor</Label>
            <ProviderSelector
              providers={providers || []}
              isLoading={isLoadingProviders}
              value={formData.provider_id}
              onChange={(value) =>
                setFormData({ ...formData, provider_id: value })
              }
              disabled={false}
            />
          </div>

          <div className="flex flex-col gap-2 -mt-2">
            <Label className="mt-2">Comprador</Label>
            <PurchasingAgentSelector
              value={formData.purchasing_agent_id}
              onChange={(value) =>
                setFormData({ ...formData, purchasing_agent_id: value })
              }
              disabled={false}
            />
          </div>




          <div className="flex flex-col gap-2 ">
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

          <div className="flex flex-col gap-2 relative col-span-2">
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

              <div>
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
              </div>
            </div>
          </div>
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
            loadOrderLots={formData.lots ?? []}
            onAddElementToLoadOrder={(newLot) => {
              setFormData({
                ...formData,
                lots: [...(formData.lots ?? []), newLot],
              });
            }}
          />
        </CardContent>

        <CardFooter>
          <Button
            disabled={
              !formData.lots ||
              formData.lots.length === 0 ||
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

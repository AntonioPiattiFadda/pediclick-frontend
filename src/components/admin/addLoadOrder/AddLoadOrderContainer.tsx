import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import TableSkl from "../sellPoints/ui/tableSkl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppSelector } from "@/hooks/useUserData";
import { getProviders } from "@/service/providers";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ProviderSelector } from "../stock/addEditProduct/ProvidersSelector";
import { AddLoadOrderTable } from "./AddLoadOrderTable";
import { emptyLoadOrder } from "./emptyFormData";

export const AddLoadOrderContainer = () => {
  const { role } = useAppSelector((state) => state.user);
  const [formData, setFormData] = useState(emptyLoadOrder);

  const { data: providers, isLoading: isLoadingProviders } = useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const response = await getProviders(role);
      return response.providers;
    },
  });

  // NOTE Falta asignTo y receptor_id

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Remito</CardTitle>
              <CardDescription>Gestiona tu remito</CardDescription>
            </div>
            {/* <div className="flex flex-col sm:flex-row gap-2">
              <AddLoadOrderBtn />
            </div> */}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 items-center">
            <Label htmlFor="expiration_date">Número de remito</Label>
          </div>
          <Input
            type="number"
            name="load_order_number"
            value={formData.load_order_number}
            onChange={(e) =>
              setFormData({ ...formData, load_order_number: e.target.value })
            }
          />
          <ProviderSelector
            providers={providers || []}
            isLoading={isLoadingProviders}
            value={formData.provider_id}
            onChange={(id) => ({ provider_id: id })}
          />
          <div className="flex gap-2 items-center">
            <Label htmlFor="expiration_date">Fecha de entrega</Label>
          </div>
          <Input
            placeholder="Fecha de entrega"
            type="date"
            value={formData.delivery_date}
            onChange={(e) =>
              setFormData({ ...formData, delivery_date: e.target.value })
            }
          />
          <Label className="mt-2">Transportista</Label>
          <div className="grid grid-cols-3 gap-4 mt-3">
            <div>
              <Label htmlFor="company">Compania</Label>
              <Input
                id="company"
                type="string"
                value={formData.transporter_data.delivery_company}
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
              <Label htmlFor="min">Nombre</Label>
              <Input
                id="min"
                type="string"
                value={formData.transporter_data.name}
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
              <Label htmlFor="max">Patente</Label>
              <Input
                id="max"
                type="string"
                value={formData.transporter_data.licence_plate}
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
          </div>
          <div>
            <Label htmlFor="max">Precio del transporte</Label>
            <Input
              id="max"
              type="number"
              value={formData.delivery_price}
              onChange={(e) =>
                setFormData({ ...formData, delivery_price: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="max">Número de factura</Label>
            <Input
              id="max"
              type="number"
              value={formData.invoice_number}
              onChange={(e) =>
                setFormData({ ...formData, invoice_number: e.target.value })
              }
            />
          </div>
          <AddLoadOrderTable formData={formData} />
        </CardContent>
      </Card>
    </div>
  );
};

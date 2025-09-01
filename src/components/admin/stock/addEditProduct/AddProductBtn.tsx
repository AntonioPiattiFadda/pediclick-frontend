/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";

import { adaptProductForDb } from "@/adapters/products";
import { Label } from "@/components/ui/label";
import { useUserStoresContext } from "@/contexts/UserStoresContext";
import { useAppSelector } from "@/hooks/useUserData";
import { createProductSchema } from "@/validator/products";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CategorySelector } from "../CategorySelector";
import { BrandSelector } from "./BrandsSelector";
import { ImageSelector } from "./ImageSelector";
import LotSelector from "./LotSelector";
import PricesSelector from "./PricesSelector";
import { ProviderSelector } from "./ProvidersSelector";
import { SaleUnitSelector } from "./SaleUnitsSelector";
import { SubCategorySelector } from "./SubCategorySelector";
import { emptyLotWithLotControl, emptyLotWithoutControl, emptyProduct } from "./emptyFormData";
import { getProviders } from "@/service/providers";
import { getCategories } from "@/service/categories";
import { getSubCategories } from "@/service/subCategories";
import { createProduct } from "@/service/products";
import { getSaleUnits } from "@/service/saleUnits";


export function AddProductBtn({shortAddBtn = false}: {shortAddBtn?: boolean}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tab, setTab] = useState("info");
  const [formData, setFormData] = useState(emptyProduct);
  
  const [selectedLotIndex, setSelectedLotIndex] = useState<number | null>(0);
  
  const currentLot =
  selectedLotIndex !== null
  ? formData.lots[selectedLotIndex]
  : emptyLotWithoutControl;
  
  const updateCurrentLot = (updatedLot: typeof emptyLotWithoutControl) => {
    if (selectedLotIndex === null) return;
    const newLots = [...formData.lots];
    newLots[selectedLotIndex] = updatedLot;
    setFormData({ ...formData, lots: newLots });
  };
  
  const handleUpdateLotPrices = (updatedPrices: any[]) => {
    updateCurrentLot({ ...currentLot, prices: updatedPrices });
  };
  
  const queryClient = useQueryClient();

  const { role } = useAppSelector((state) => state.user);
  const { selectedStoreId } = useUserStoresContext();
  
  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await getCategories(role);
      return response.categories;
    },
  });
  
  const { data: subCategories, isLoading: isLoadingSub } = useQuery({
    queryKey: ["sub-categories"],
    queryFn: async () => {
      const response = await getSubCategories(role);
      return response.categories;
    },
  });
  
  const { data: providers, isLoading: isLoadingProviders } = useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const response = await getProviders(role);
      return response.providers;
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: { completedInformation: any }) => {
      return await createProduct(data.completedInformation);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsModalOpen(false);
      toast("Producto creado exitosamente", {
        description: "El producto ha sido creado correctamente.",
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      });
      setFormData(emptyProduct);
    },
    onError: () => {
      toast("Error al crear el producto", {
        description: "Intentá nuevamente más tarde.",
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      });
    },
  });
  
  const handleSubmit = () => {
    const completedInformation = adaptProductForDb(
      formData,
      selectedStoreId || 0
    );

    const validation = createProductSchema.safeParse(completedInformation);
    
    if (!validation.success) {
      toast("Algunos datos fantantes ", {
        description: "Sunday, December 03, 2023 at 9:00 AM",
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      });
      return;
    }
    console.log("completedInformation", completedInformation);
    createProductMutation.mutate({
      completedInformation,
    });
  };
  
  const { data: saleUnits, isLoading: isLoadingSaleUnits } = useQuery({
    queryKey: ["sale_units"],
    queryFn: async () => {
      const response = await getSaleUnits(role);
      return response.saleUnits;
    },
  });
  
  
  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-accent" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Agregar producto
        </Button>
      </DialogTrigger>
      <DialogContent className=" w-[750px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nuevo producto</DialogTitle>
          <DialogDescription>
            Completá la información del nuevo producto que querés publicar.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          {!shortAddBtn && (
          <TabsList>
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="prices">Stock / Lotes</TabsTrigger>
            <TabsTrigger value="images">
              Imágenes {selectedLotIndex}
            </TabsTrigger>

            {/* <TabsTrigger value="seo">SEO</TabsTrigger> */}
          </TabsList>
          )}

          <TabsContent value="info" className="space-y-4">
            <Label htmlFor="short_code">Código Corto</Label>
            <Input
              placeholder="Codigo Corto"
              type="number"
              value={formData.short_code}
              onChange={(e) =>
                setFormData({ ...formData, short_code: e.target.value })
              }
            />
            <Label htmlFor="product_name">Nombre*</Label>
            <Input
              placeholder="Nombre"
              value={formData.product_name}
              onChange={(e) =>
                setFormData({ ...formData, product_name: e.target.value })
              }
            />

            <CategorySelector
              categories={categories || []}
              isLoading={isCategoriesLoading}
              value={formData.category_id}
              onChange={(id) => setFormData({ ...formData, category_id: id })}
            />

            <SubCategorySelector
              subCategories={subCategories || []}
              isLoading={isLoadingSub}
              value={formData.sub_category_id}
              onChange={(id) =>
                setFormData({ ...formData, sub_category_id: id })
              }
            />

            <BrandSelector
              value={formData.brand_id}
              onChange={(id) => setFormData({ ...formData, brand_id: id })}
            />

            <Label htmlFor="barcode">Código de Barras</Label>
            <Input
              placeholder="Código de Barras"
              value={formData.barcode}
              type="number"
              onChange={(e) =>
                setFormData({ ...formData, barcode: e.target.value })
              }
            />
          </TabsContent>

          <TabsContent value="prices" className="space-y-4">
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allow_stock_control}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      allow_stock_control: e.target.checked,
                    })
                  }
                />
                <span>Recibir notificaciones de stock</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.lot_control}
                  onChange={(e) => {
                    if (!e.target.checked) {
                      const lotWithNoControlLots = formData.lots.findIndex(
                        (lot: any) => !lot.lot_control
                      );
                      setSelectedLotIndex(lotWithNoControlLots);
                    } else {
                      setSelectedLotIndex(1);
                    }
                    setFormData({
                      ...formData,
                      lot_control: e.target.checked,
                    });
                  }}
                />
                <span>Manejo por lotes</span>
              </label>
            </div>
            {formData.lot_control && (
              <LotSelector
                formData={formData}
                setFormData={setFormData}
                selectedLotIndex={selectedLotIndex}
                setSelectedLotIndex={setSelectedLotIndex}
                emptyLot={emptyLotWithLotControl}
              />
            )}

            <div
              className="
            "
            >
              <SaleUnitSelector
                saleUnits={saleUnits || []}
                isLoadingSaleUnits={isLoadingSaleUnits}
                value={formData.sale_unit_id}
                onChange={(value) =>
                  setFormData({ ...formData, sale_unit_id: value })
                }
              />

              <PricesSelector
                prices={currentLot.prices}
                setPrices={handleUpdateLotPrices}
                saleUnits={saleUnits || []}
                selectedUnitId={formData.sale_unit_id}
                lots={formData.lots}
                currentLotIndex={selectedLotIndex ?? 0}
                lotControl={formData.lot_control}
              />

              <ProviderSelector
                providers={providers || []}
                isLoading={isLoadingProviders}
                value={currentLot.provider_id}
                onChange={(id) =>
                  updateCurrentLot({ ...currentLot, provider_id: id })
                }
              />

              <Label className="mt-2">Stock</Label>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <Label htmlFor="quantity">Cantidad</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={currentLot.stock.quantity}
                    onChange={(e) =>
                      updateCurrentLot({
                        ...currentLot,
                        stock: {
                          ...currentLot.stock,
                          quantity: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="min">Mínimo</Label>
                  <Input
                    id="min"
                    type="number"
                    value={currentLot.stock.min}
                    onChange={(e) =>
                      updateCurrentLot({
                        ...currentLot,
                        stock: {
                          ...currentLot.stock,
                          min: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="max">Máximo</Label>
                  <Input
                    id="max"
                    type="number"
                    value={currentLot.stock.max}
                    onChange={(e) =>
                      updateCurrentLot({
                        ...currentLot,
                        stock: {
                          ...currentLot.stock,
                          max: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <Label htmlFor="bulk">Cantidad por bulto</Label>
            <Input
              placeholder="Cantidad por bulto"
              type="number"
              value={currentLot.bulk}
              onChange={(e) =>
                updateCurrentLot({ ...currentLot, bulk: e.target.value })
              }
            />

            <Label htmlFor="waste">Merma / Desperdicio</Label>
            <Input
              placeholder="Merma"
              type="number"
              value={currentLot.waste}
              onChange={(e) =>
                updateCurrentLot({ ...currentLot, waste: e.target.value })
              }
            />

           

            <div className="flex gap-2 items-center">
              <Label htmlFor="expiration_date">Vencimiento</Label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentLot.expiration_date_notification}
                  onChange={(e) =>
                    updateCurrentLot({
                      ...currentLot,
                      expiration_date_notification: e.target.checked,
                    })
                  }
                />
                <span>Notificar vencimiento</span>
              </label>
            </div>

            <Input
              placeholder="Fecha de Vencimiento"
              type="date"
              value={currentLot.expiration_date}
              onChange={(e) =>
                updateCurrentLot({
                  ...currentLot,
                  expiration_date: e.target.value,
                })
              }
            />
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            <ImageSelector
              onImageSelect={(id) =>
                setFormData({ ...formData, public_image_id: id ?? "" })
              }
              onImageRemove={() =>
                setFormData({ ...formData, public_image_id: "" })
              }
            />
            {/* <div
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-dashed border-2 rounded p-6 text-center cursor-pointer"
            >
              <UploadCloud className="mx-auto mb-2" />
              <p>Arrastrá imágenes acá o seleccioná archivos</p>
              <Input
                type="file"
                multiple
                onChange={(e) =>
                  setImages([
                    ...images,
                    ...(e.target.files ? Array.from(e.target.files) : []),
                  ])
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {imagePreviews.map((src, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={src}
                    alt="preview"
                    className="w-full h-32 object-cover rounded"
                  />
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => handleImageReorder(idx, "up")}>
                      ⬆️
                    </button>
                    <button onClick={() => handleImageReorder(idx, "down")}>
                      ⬇️
                    </button>
                    <button onClick={() => handleRemoveImage(idx)}>
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div> */}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button
              disabled={createProductMutation.isLoading}
              variant="outline"
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            disabled={createProductMutation.isLoading}
            onClick={handleSubmit}
          >
            {createProductMutation.isLoading ? "Creando..." : "Crear producto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

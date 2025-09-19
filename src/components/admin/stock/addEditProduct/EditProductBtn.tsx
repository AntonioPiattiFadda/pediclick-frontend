/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
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
import { Edit } from "lucide-react";
import { useEffect, useState } from "react";

import { adaptProductForDb } from "@/adapters/products";
import { Label } from "@/components/ui/label";
import { UseUserStoresContext } from "@/contexts/UserStoresContextUNUSED";
import { useAppSelector } from "@/hooks/useUserData";
import { updateProductSchema } from "@/validator/products";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BrandSelector } from "./BrandsSelector";
import { CategorySelector } from "../../shared/CategorySelector";
import { ImageSelector } from "./ImageSelector";
import { ProviderSelector } from "./ProvidersSelector";
import { SaleUnitSelector } from "./SaleUnitsSelector";
import { SubCategorySelector } from "./SubCategorySelector";
import { getProduct, updateProduct } from "@/service/products";
import {
  emptyProduct,
  emptyLotWithoutControl,
  emptyLotWithLotControl,
} from "./emptyFormData";
import PricesSelector from "./PricesSelector";
import LotSelector from "./LotSelector";
import { getCategories } from "@/service/categories";
import { getSubCategories } from "@/service/subCategories";
import { getProviders } from "@/service/providers";
import { getSaleUnits } from "@/service/saleUnits";

interface EditProductBtnProps {
  productId: number;
  children?: React.ReactNode;
}

export function EditProductBtn({ productId }: EditProductBtnProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [tab, setTab] = useState("info");
  const [hasChanges, setHasChanges] = useState(false);
  const [initialFormData, setInitialFormData] = useState<any>(null);

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
  const { selectedStoreId } = UseUserStoresContext();

  const { data: productData, isLoading: isProductLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const response = await getProduct(productId);
      return response.product;
    },
    enabled: isModalOpen && !!productId,
  });

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await getCategories(role);
      return response.categories;
    },
    enabled: isModalOpen,
  });

  const { data: subCategories, isLoading: isLoadingSub } = useQuery({
    queryKey: ["sub-categories"],
    queryFn: async () => {
      const response = await getSubCategories(role);
      return response.categories;
    },
    enabled: isModalOpen,
  });

  const { data: providers, isLoading: isLoadingProviders } = useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const response = await getProviders(role);
      return response.providers;
    },
    enabled: isModalOpen,
  });

  const { data: saleUnits, isLoading: isLoadingSaleUnits } = useQuery({
    queryKey: ["sale_units"],
    queryFn: async () => {
      const response = await getSaleUnits(role);
      return response.saleUnits;
    },
    enabled: isModalOpen,
  });

  useEffect(() => {
    if (productData) {
      const initialData = {
        short_code:
          productData.short_code !== undefined &&
            productData.short_code !== null
            ? String(productData.short_code)
            : "",
        product_name: productData.product_name || "",
        category_id:
          productData.category_id !== undefined &&
            productData.category_id !== null
            ? String(productData.category_id)
            : "",
        sub_category_id:
          productData.sub_category_id !== undefined &&
            productData.sub_category_id !== null
            ? String(productData.sub_category_id)
            : "",
        brand_id:
          productData.brand_id !== undefined && productData.brand_id !== null
            ? String(productData.brand_id)
            : "",
        sale_unit_id:
          productData.sale_unit_id !== undefined &&
            productData.sale_unit_id !== null
            ? String(productData.sale_unit_id)
            : "",
        barcode:
          productData.barcode !== undefined && productData.barcode !== null
            ? String(productData.barcode)
            : "",
        public_image_id:
          productData.public_image_id !== undefined &&
            productData.public_image_id !== null
            ? String(productData.public_image_id)
            : "",
        allow_stock_control: productData.allow_stock_control ?? false,
        lot_control: productData.lot_control ?? false,
        lots: [emptyLotWithoutControl, emptyLotWithLotControl],
      };

      console.log("initialData", initialData);

      setFormData(initialData);
      setInitialFormData(initialData);
      setSelectedLotIndex(0);
      setHasChanges(false);
    }
  }, [productData]);

  // Detectar cambios en el formulario
  useEffect(() => {
    if (!initialFormData) return;

    const formDataChanged =
      JSON.stringify(formData) !== JSON.stringify(initialFormData);

    setHasChanges(formDataChanged);
  }, [formData, initialFormData]);

  const updateProductMutation = useMutation({
    mutationFn: async (data: { completedInformation: any }) => {
      return await updateProduct(productId, data.completedInformation);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      setIsModalOpen(false);
      setHasChanges(false);
      toast("Producto actualizado exitosamente", {
        description: "El producto ha sido actualizado correctamente.",
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      });
    },
    onError: () => {
      toast("Error al actualizar el producto", {
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

    const validation = updateProductSchema.safeParse(completedInformation);

    if (!validation.success) {
      toast("Algunos datos faltantes", {
        description: "Por favor, completá todos los campos requeridos.",
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      });
      return;
    }

    console.log("completedInformation", completedInformation);
    updateProductMutation.mutate({
      completedInformation,
    });
  };

  const handleCancel = () => {
    if (hasChanges) {
      setShowCancelDialog(true);
    } else {
      setIsModalOpen(false);
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelDialog(false);
    setIsModalOpen(false);
    // Restaurar datos iniciales
    if (initialFormData) {
      setFormData(initialFormData);
      setSelectedLotIndex(0);
      setHasChanges(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && hasChanges) {
      setShowCancelDialog(true);
    } else {
      setIsModalOpen(open);
      if (!open) {
        // Limpiar estado cuando se cierra
        setTab("info");
        setHasChanges(false);
      }
    }
  };

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <button>
            <Edit className="mr-2 h-4 w-4" />
          </button>
        </DialogTrigger>
        <DialogContent className=" w-[750px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Editar producto V"</DialogTitle>
            <DialogDescription>
              Modificá la información del producto seleccionado.
            </DialogDescription>
          </DialogHeader>

          {isProductLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList>
                <TabsTrigger value="info">Información</TabsTrigger>
                <TabsTrigger value="prices">Stock / Lotes</TabsTrigger>
                <TabsTrigger value="images">
                  Imágenes {selectedLotIndex}
                </TabsTrigger>
              </TabsList>

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
                  onChange={(id) =>
                    setFormData({ ...formData, category_id: id })
                  }
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

                <div>
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

                <Label htmlFor="lot">Nro de Lote</Label>
                <Input
                  placeholder="Nro de Lote"
                  type="text"
                  value={currentLot.lot}
                  onChange={(e) =>
                    updateCurrentLot({ ...currentLot, lot: e.target.value })
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
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="mt-4">
            <Button
              disabled={updateProductMutation.isLoading}
              variant="outline"
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button
              disabled={updateProductMutation.isLoading || !hasChanges}
              onClick={handleSubmit}
            >
              {updateProductMutation.isLoading
                ? "Actualizando..."
                : "Actualizar producto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para cancelar */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar edición?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. Si cancelas, perderás todos los
              cambios realizados. ¿Estás seguro que deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCancelDialog(false)}>
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel}>
              Sí, cancelar edición
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

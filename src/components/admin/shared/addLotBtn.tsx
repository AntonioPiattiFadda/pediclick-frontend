import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLot } from "@/service/lots";
import type { Lot } from "@/types/lots";
import type { Product, SellMeasurementMode } from "@/types/products";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Barcode, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { emptyProduct } from "../stock/addEditProduct/emptyFormData";
import { CategorySelector } from "../stock/CategorySelector";
import CheckBoxesSelector from "./checkBoxesSelector";
import { emptyLot } from "./emptyFormData";
import ProductSelectorV2 from "./productSelectorV2";
import { SubCategorySelector } from "../stock/addEditProduct/SubCategorySelector";
import { BrandSelector } from "../stock/addEditProduct/BrandsSelector";
import { ImageSelector } from "../stock/addEditProduct/ImageSelector";
import { Textarea } from "@/components/ui/textarea";
import { LotContainerSelector } from "../addLoadOrder/lotContainerSelector";
import { adaptLotData } from "@/adapters/lot";

type CreationMode = "SHORT" | "LONG";

const creationModeOptions = [
  { label: "Corto", value: "SHORT" },
  { label: "Largo", value: "LONG" },
];

const sellMeasurementModeOptions = [
  { label: "Unidad", value: "QUANTITY" },
  { label: "Kg", value: "WEIGHT" },
];

export function AddLotBtn({
  onAddElementToLoadOrder,
}: {
  onAddElementToLoadOrder: (lot: Lot) => void;
}) {
  const [creationMode, setCreationMode] = useState<CreationMode>("SHORT");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product>(emptyProduct);

  const isProductSelected = Boolean(selectedProduct.product_id);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<Lot>(emptyLot);

  const queryClient = useQueryClient();

  //   const { role } = useAppSelector((state) => state.user);
  //   const { selectedStoreId } = useUserStoresContext();

  const createLotMutation = useMutation({
    //Pasarle el providerId
    mutationFn: async (data: { completedInformation: Lot }) => {
      const adaptedLotData = adaptLotData(data.completedInformation);
      return await createLot(adaptedLotData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsModalOpen(false);
      toast("Elemento creado exitosamente", {
        description: "El elemento ha sido creado correctamente.",
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      });
      setFormData(emptyLot);
    },
    onError: () => {
      toast("Error al agregar el elemento", {
        description: "Intentá nuevamente más tarde.",
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      });
    },
  });

  const handleSubmit = () => {
    // const completedInformation = adaptProductForDb(
    //   formData,
    //   selectedStoreId || 0
    // );

    // const validation = createProductSchema.safeParse(completedInformation);

    // if (!validation.success) {
    //   toast("Algunos datos fantantes ", {
    //     description: "Sunday, December 03, 2023 at 9:00 AM",
    //     action: {
    //       label: "Undo",
    //       onClick: () => console.log("Undo"),
    //     },
    //   });
    //   return;
    // }
    // console.log("completedInformation", completedInformation);

    //TODO ACTUALIZAR PRODUCTO SI ESTA EN MODO EDICION

    //TODO AGREGAR AL REMITO

    onAddElementToLoadOrder({
      ...formData,
      product_name: selectedProduct.product_name,
    } as Lot);
    setIsModalOpen(false);
    setIsEditing(false);
    setSelectedProduct(emptyProduct);
    setFormData(emptyLot);
    // createLotMutation.mutate({
    //   completedInformation: formData,
    // });
  };

  // const { data: subCategories, isLoading: isLoadingSub } = useQuery({
  //   queryKey: ["sub-categories"],
  //   queryFn: async () => {
  //     const response = await getSubCategories(role);
  //     return response.categories;
  //   },
  // });

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-accent" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Agregar elemento
        </Button>
      </DialogTrigger>
      <DialogContent
        className={`border-4   ${
          isEditing ? " border-green-200 " : "border-transparent"
        }  flex  flex-col gap-2 w-[750px] overflow-y-auto max-h-[90vh] min-h-[500px]`}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Editando producto"
              : `${
                  selectedProduct.product_name
                    ? "Producto: " + selectedProduct.product_name
                    : "Elegir producto"
                }`}
          </DialogTitle>
          {/* <DialogDescription>
            Completá la información del nuevo elemento que querés publicar.
          </DialogDescription> */}
        </DialogHeader>

        {!isEditing && (
          <ProductSelectorV2
            value={selectedProduct}
            onChange={(value) =>
              setSelectedProduct({ ...selectedProduct, ...value })
            }
          />
        )}

        {/* <ProductSelector
          value={selectedProduct.product_id || 0}
          onChange={setSelectedProduct}
        /> */}

        {isProductSelected ? (
          <>
            <CheckBoxesSelector
              options={creationModeOptions}
              selectedOption={creationMode}
              onSelectOption={(value) => setCreationMode(value as CreationMode)}
              disabled={!isEditing}
            />

            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-2">
                <Label htmlFor="lot_number">Código corto</Label>
                <Input
                  placeholder="Código corto"
                  disabled={!isEditing}
                  type="number"
                  value={selectedProduct.short_code || ""}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      short_code: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="flex gap-2" htmlFor="barcode">
                  Código de barras <Barcode height={14} />
                </Label>
                <Input
                  placeholder="barcode"
                  disabled={!isEditing}
                  type="number"
                  value={selectedProduct.barcode || ""}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      barcode: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="waste">Rubro</Label>
                <CategorySelector
                  disabled={!isEditing}
                  value={selectedProduct.category_id}
                  onChange={(id) =>
                    setSelectedProduct({ ...selectedProduct, category_id: id })
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="waste">Categoría</Label>
                <SubCategorySelector
                  disabled={!isEditing}
                  value={selectedProduct.sub_category_id}
                  onChange={(id) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      sub_category_id: id,
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="waste">Marca</Label>
                <BrandSelector
                  disabled={!isEditing}
                  value={selectedProduct.brand_id}
                  onChange={(id) =>
                    setSelectedProduct({ ...selectedProduct, brand_id: id })
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="product_name">Nombre</Label>
                <Input
                  placeholder="product_name"
                  disabled={!isEditing}
                  type="text"
                  value={selectedProduct.product_name}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      product_name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Modo de venta</Label>

                <CheckBoxesSelector
                  options={sellMeasurementModeOptions}
                  selectedOption={selectedProduct.sell_measurement_mode}
                  onSelectOption={(value) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      sell_measurement_mode: value as SellMeasurementMode,
                    })
                  }
                  disabled={!isEditing}
                />
              </div>

              <div className="flex flex-col gap-2 col-span-2">
                <Label htmlFor="observations">Observaciones</Label>
                <Textarea
                  placeholder=""
                  disabled={!isEditing}
                  value={selectedProduct.observations || ""}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      observations: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {creationMode === "LONG" && (
              <>
                <ImageSelector
                  onImageSelect={(id) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      public_image_id: id ?? "",
                    })
                  }
                  onImageRemove={() =>
                    setSelectedProduct({
                      ...selectedProduct,
                      public_image_id: "",
                    })
                  }
                />
              </>
            )}

            <div className="grid grid-cols-2 gap-4 w-full">
              {/* //Vendra del remito porque el remito es quien crea los lotes.
                provider_id: number | null;
               
              
                is_sold_out: boolean;
              
                waste: {
                  quantity: number | null;
                  created_at: string | null;
                  should_notify_owner: boolean;
                  location: Location | null;
                  };
                  
                stock_movement: StockMovement[] | null;
                stock: Stock[] | null;
                prices: Price[]; */}

              <div className="flex flex-col gap-2">
                <Label htmlFor="waste">Vacio</Label>
                <LotContainerSelector
                  disabled={!isEditing}
                  value={formData.lot_container_id}
                  onChange={(value) =>
                    setFormData({ ...formData, lot_container_id: value })
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="lot_number">Nro de Lote</Label>
                <Input
                  placeholder="Nro de Lote"
                  disabled={!isEditing}
                  type="number"
                  value={formData.lot_number}
                  onChange={(e) =>
                    setFormData({ ...formData, lot_number: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="waste">Merma</Label>
                <Input
                  placeholder="Merma"
                  disabled={!isEditing}
                  type="number"
                  value={formData.waste}
                  onChange={(e) =>
                    setFormData({ ...formData, waste: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Label htmlFor="expiration_date">
                    Fecha de vencimiento. | Activar notificacion
                  </Label>
                  <input
                    type="checkbox"
                    checked={formData.expiration_date_notification}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expiration_date_notification: e.target.checked,
                      })
                    }
                  />
                </div>
                <Input
                  placeholder="Fecha de vencimiento"
                  disabled={!isEditing}
                  type="date"
                  value={formData.expiration_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expiration_date: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="stock">Stock de ingreso</Label>
                <Input
                  placeholder="Stock de ingreso"
                  disabled={!isEditing}
                  type="number"
                  value={formData.initial_stock_quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      initial_stock_quantity: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="stock">Precios:</Label>
                <Input
                  placeholder="Stock de ingreso"
                  disabled={!isEditing}
                  type="number"
                  value={formData.initial_stock_quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      initial_stock_quantity: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-2 relative col-span-2">
                <Label className="mt-2 absolute -top-4">
                  Cantidad por mayor / menor
                </Label>
                <div className="grid grid-cols-4 gap-4 mt-3">
                  <div>
                    <Label className="text-xs" htmlFor="company">
                      Cantidad por mayor
                    </Label>
                    <Input
                      id="company"
                      type="string"
                      value={
                        formData.sale_units_equivalence.mayor.quantity_in_base
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sale_units_equivalence: {
                            ...formData.sale_units_equivalence,
                            mayor: {
                              ...formData.sale_units_equivalence.mayor,
                              quantity_in_base: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs" htmlFor="company">
                      Cantidad por menor
                    </Label>
                    <Input
                      id="company"
                      type="string"
                      value={
                        formData.sale_units_equivalence.minor.quantity_in_base
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sale_units_equivalence: {
                            ...formData.sale_units_equivalence,
                            minor: {
                              ...formData.sale_units_equivalence.minor,
                              quantity_in_base: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full text-center  my-auto">
            Seleccionar un producto
          </div>
        )}

        <DialogFooter className="mt-auto translate-y-6 sticky bottom-0 right-0 bg-white border-t-1 border-t-gray-200 py-4">
          {selectedProduct?.updated_at && (
            <span className="mr-auto h-full my-auto">
              Ultima actualización: {selectedProduct.updated_at}
            </span>
          )}

          {/* <DialogClose asChild>
            <Button disabled={createLotMutation.isLoading} variant="outline">
              Cancelar
            </Button>
          </DialogClose> */}
          {Object.keys(selectedProduct).length > 0 && (
            <>
              {isEditing ? (
                <Button variant={"outline"} onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Modificar</Button>
              )}

              <Button
                disabled={createLotMutation.isLoading}
                onClick={handleSubmit}
              >
                {createLotMutation.isLoading
                  ? "Agregando..."
                  : "Agregar a remito"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

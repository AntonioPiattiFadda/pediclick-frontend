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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Lot } from "@/types/lots";
import type { Price } from "@/types/prices";
import type { Product, SellMeasurementMode } from "@/types/products";
import { adaptProductForDb } from "@/adapters/products";
import { Barcode, Plus } from "lucide-react";
import { useState } from "react";
import { LotContainerSelector } from "../addLoadOrder/lotContainerSelector";
import { BrandSelector } from "../stock/addEditProduct/BrandsSelector";
import { ImageSelector } from "../stock/addEditProduct/ImageSelector";
import { SubCategorySelector } from "../stock/addEditProduct/SubCategorySelector";
import { CategorySelector } from "./CategorySelector";
import CheckBoxesSelector from "./checkBoxesSelector";
import { emptyLot, emptyProduct } from "./emptyFormData";
import { PricesSelectorV2 } from "./pricesSelectorV2";
import ProductSelectorV2 from "./productSelector";

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

  const [formData, setFormData] = useState<Lot>(emptyLot);
  const [selectedProduct, setSelectedProduct] = useState<Product>(() => adaptProductForDb(emptyProduct));
  const [lotPrices, setLotPrices] = useState<Price[]>([]);

  const isProductSelected = Boolean(selectedProduct.product_id);
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = () => {
    //TODO ACTUALIZAR PRODUCTO SI ESTA EN MODO EDICION

    //TODO AGREGAR AL REMITO

    onAddElementToLoadOrder({
      ...formData,
      product_name: selectedProduct.product_name,
      product_id: selectedProduct.product_id,
      prices: lotPrices,
    } as Lot);
    setIsModalOpen(false);
    setIsEditing(false);
    setSelectedProduct(adaptProductForDb(emptyProduct));
    setLotPrices([]);
    setFormData(emptyLot);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-accent" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Agregar elemento
        </Button>
      </DialogTrigger>
      <DialogContent
        className={`border-4   ${isEditing ? " border-green-200 " : "border-transparent"
          }  flex  flex-col gap-2 w-[750px] overflow-y-auto max-h-[90vh] min-h-[500px]`}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Editando producto"
              : `${selectedProduct.product_name
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
            <Tabs defaultValue="lot" className="w-full">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="lot">Lote</TabsTrigger>
                <TabsTrigger value="product">Producto</TabsTrigger>
              </TabsList>

              <TabsContent value="lot" className="mt-4">
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="flex flex-col gap-2 col-span-2">
                    <Label htmlFor="lot_number">Precios</Label>
                    <Input
                      type="number"
                      placeholder="Cantidad por ingresar"
                      disabled={!isEditing}
                      value={formData.initial_stock_quantity || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          initial_stock_quantity: Number(e.target.value),
                          cost_per_unit: formData.total_cost
                            ? Number(formData.total_cost) /
                            Number(e.target.value || 1)
                            : 0,
                          total_cost: formData.cost_per_unit
                            ? Number(formData.cost_per_unit) *
                            Number(e.target.value || 1)
                            : 0,
                        })
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Precio de costo total del lote"
                      disabled={!isEditing}
                      value={formData.total_cost || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          total_cost: Number(e.target.value),
                          cost_per_unit:
                            Number(e.target.value) /
                            Number(formData.initial_stock_quantity || 1),
                        })
                      }
                    />
                    <span className="text-xs text-gray-500">
                      Ingresar el costo total del lote (no el costo por unidad)
                    </span>

                    <PricesSelectorV2
                      value={lotPrices}
                      onChange={(prices) => setLotPrices(prices)}
                      lotId={formData?.lot_id || 0}
                      disabled={!isEditing}
                      basePrice={formData.total_cost || 0}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="waste">Vacio</Label>
                    <LotContainerSelector
                      disabled={!isEditing}
                      value={formData.lot_container_id === null ? "" : String(formData.lot_container_id)}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          lot_container_id: value ? Number(value) : null,
                        })
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="lot_number">Nro de Lote</Label>
                    <Input
                      placeholder="Nro de Lote"
                      disabled={!isEditing}
                      type="number"
                      value={formData.lot_number ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lot_number: e.target.value === "" ? null : Number(e.target.value),
                        })
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
                      value={formData.expiration_date ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expiration_date: e.target.value,
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
                                  quantity_in_base: Number(e.target.value) as unknown as 0,
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
                                  quantity_in_base: Number(e.target.value) as unknown as 0,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="product" className="mt-4">
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
                      value={selectedProduct.short_code ?? ""}
                      onChange={(e) =>
                        setSelectedProduct({
                          ...selectedProduct,
                          short_code: e.target.value === "" ? null : Number(e.target.value),
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
                      value={selectedProduct.barcode ?? ""}
                      onChange={(e) =>
                        setSelectedProduct({
                          ...selectedProduct,
                          barcode: e.target.value === "" ? null : Number(e.target.value),
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
                      value={selectedProduct.sub_category_id?.toString() ?? ""}
                      onChange={(id) =>
                        setSelectedProduct({
                          ...selectedProduct,
                          sub_category_id: id ? Number(id) : null,
                        })
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="waste">Marca</Label>
                    <BrandSelector
                      disabled={!isEditing}
                      value={selectedProduct.brand_id?.toString() ?? ""}
                      onChange={(id) =>
                        setSelectedProduct({
                          ...selectedProduct,
                          brand_id: id ? Number(id) : null,
                        })
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
                          public_image_id: id ? Number(id) : null,
                        })
                      }
                      onImageRemove={() =>
                        setSelectedProduct({
                          ...selectedProduct,
                          public_image_id: null,
                        })
                      }
                    />
                  </>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="w-full h-full text-center  my-auto">
            Seleccionar un producto
          </div>
        )}

        <DialogFooter
          className={` mt-auto translate-y-6 sticky bottom-0 right-0 bg-white border-t-1 border-t-gray-200 py-4`}
        >
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

              {isEditing ? (
                <Button onClick={handleSubmit}>Guardar Cambios</Button>
              ) : (
                <Button onClick={handleSubmit}>Agregar al remito</Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

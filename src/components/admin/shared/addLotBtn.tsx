import { adaptProductForDb } from "@/adapters/products";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import GetFollowingLotNumberBtn from "@/components/unassigned/getFollowingLotNumberBtn";
import type { Lot } from "@/types/lots";
import type { Price } from "@/types/prices";
import type { Product } from "@/types/products";
import { DialogClose } from "@radix-ui/react-dialog";
import { Barcode, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import toast from 'react-hot-toast';
import { LotContainerSelector } from "../addLoadOrder/lotContainerSelector";
import { BrandSelectorRoot, SelectBrand } from "./brandSelector";
import { CategorySelectorRoot, SelectCategory } from "./categorySelector";
import { emptyLot } from "./emptyFormData";
import ProductSelector from "./productSelector";
import { SelectSubCategory, SubCategorySelectorRoot } from "./subCategorySelector";
import { ProductEditSheet } from "./productEditSheet";


// type CreationMode = "SHORT" | "LONG";

// const creationModeOptions = [
//   { label: "Corto", value: "SHORT" },
//   { label: "Largo", value: "LONG" },
// ];

// const sellMeasurementModeOptions = [
//   { label: "Unidad", value: "QUANTITY" },
//   { label: "Kg", value: "WEIGHT" },
// ];

export function AddLotBtn({
  onAddElement,
  loading = false,
}: {
  onAddElement: (lot: Lot) => void;
  loading?: boolean;
}) {
  // const [creationMode, setCreationMode] = useState<CreationMode>("SHORT");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<Lot>(emptyLot);
  const [selectedProduct, setSelectedProduct] = useState<Product>({} as Product);
  console.log({ selectedProduct });
  const [lotPrices, setLotPrices] = useState<Price[]>([]);
  const [tab, setTab] = useState("lot");

  const isProductSelected = Boolean(selectedProduct.product_id);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!loading) {
      handleClose();
    }
  }, [loading]);


  const handleSubmit = () => {
    if (!isProductSelected) {
      toast('Debes seleccionar un producto para agregar al remito');
      return
    };
    //TODO ACTUALIZAR PRODUCTO SI ESTA EN MODO EDICION
    //TODO AGREGAR AL REMITO
    onAddElement({
      ...formData,
      product_name: selectedProduct.product_name,
      product_id: selectedProduct.product_id,
      prices: lotPrices,
    } as Lot);

    if (!loading) {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setSelectedProduct(adaptProductForDb({} as Product));
    setLotPrices([]);
    setFormData(emptyLot);
  };



  type LotField = "initial_stock_quantity" | "purchase_cost_per_unit" | "purchase_cost_total" | "download_total_cost" | "download_cost_per_unit";

  const handleUpdateLotField = (field: LotField, rawValue: number | string) => {
    // normalizamos: si viene vacío o NaN lo tratamos como 0
    const value = Number(rawValue) || 0;

    // valores actuales (default 0 si son null/undefined)
    const currentTotalCost = formData.purchase_cost_total ?? 0;
    const currentInitialStock = formData.initial_stock_quantity ?? 0;
    const currentCostPerUnit = formData.purchase_cost_per_unit ?? 0;
    const currentDownloadTotalCost = formData.download_total_cost ?? 0;
    const currentDownloadCostPerUnit = formData.download_cost_per_unit ?? 0;

    let newTotalCost = currentTotalCost;
    let newInitialStock = currentInitialStock;
    let newCostPerUnit = currentCostPerUnit;
    let newDownloadTotalCost = currentDownloadTotalCost;
    let newDownloadCostPerUnit = currentDownloadCostPerUnit;

    switch (field) {
      case "initial_stock_quantity":
        newInitialStock = value;

        if (value <= 0) {
          // si borra el stock → todo a 0
          newTotalCost = 0;
          newCostPerUnit = 0;
          newDownloadTotalCost = 0;
          newDownloadCostPerUnit = 0;
        } else {
          // --- Compra ---
          if (currentCostPerUnit > 0) {
            newTotalCost = value * currentCostPerUnit;
          } else if (currentTotalCost > 0) {
            newCostPerUnit = currentTotalCost / value;
          }

          // --- Descarga ---
          if (currentDownloadCostPerUnit > 0) {
            newDownloadTotalCost = value * currentDownloadCostPerUnit;
          } else if (currentDownloadTotalCost > 0) {
            newDownloadCostPerUnit = currentDownloadTotalCost / value;
          }
        }
        break;

      case "purchase_cost_per_unit":
        newCostPerUnit = value;

        if (value <= 0) {
          // si borra costo unitario → total a 0
          newTotalCost = 0;
        } else if (currentInitialStock > 0) {
          newTotalCost = currentInitialStock * value;
        }
        break;

      case "purchase_cost_total":
        newTotalCost = value;

        if (value <= 0) {
          // si borra costo total → costo unitario a 0
          newCostPerUnit = 0;
        } else if (currentInitialStock > 0) {
          newCostPerUnit = value / currentInitialStock;
        }
        break;


      case "download_total_cost":
        newDownloadTotalCost = value;

        if (value <= 0) {
          // si borra costo total → costo unitario a 0
          newDownloadCostPerUnit = 0;
        } else if (currentInitialStock > 0) {
          newDownloadCostPerUnit = value / currentInitialStock;
        }
        break;

      case "download_cost_per_unit":
        newDownloadCostPerUnit = value;
        if (value <= 0) {
          // si borra costo unitario → total a 0
          newDownloadTotalCost = 0;
        }
        else if (currentInitialStock > 0) {
          newDownloadTotalCost = currentInitialStock * value;
        }
        break;
    }


    setFormData((prev) => ({
      ...prev,
      purchase_cost_total: newTotalCost,
      initial_stock_quantity: newInitialStock,
      purchase_cost_per_unit: newCostPerUnit,
      download_total_cost: newDownloadTotalCost,
      download_cost_per_unit: newDownloadCostPerUnit,
    }));
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-accent" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Agregar stock
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
          <ProductSelector
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
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="lot">Lote</TabsTrigger>
                <TabsTrigger value="product">Producto</TabsTrigger>
              </TabsList>
              {tab === "product" && (
                <div className="mt-2">
                  <ProductEditSheet
                    product={selectedProduct}
                    onUpdated={(updated) => setSelectedProduct(updated)}
                  />
                </div>
              )}

              <TabsContent value="lot" className="flex flex-col gap-2 mt-2">
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="lot_number">Nro de Lote</Label>
                    <div className="grid grid-cols-[1fr_50px] gap-2">
                      <Input
                        placeholder="Nro de Lote"
                        // disabled={!isEditing}
                        type="number"
                        value={formData.lot_number ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            lot_number: e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                      />
                      <GetFollowingLotNumberBtn onClick={(nextLotNumber) => {
                        setFormData({
                          ...formData,
                          lot_number: nextLotNumber,
                        });
                      }} productId={selectedProduct.product_id!} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="initial_stock_quantity">Stock nuevo</Label>
                    <Input
                      type="number"
                      placeholder="Stock inicial"
                      // disabled={!isEditing}
                      value={formData.initial_stock_quantity || ""}
                      onChange={(e) => handleUpdateLotField("initial_stock_quantity", Number(e.target.value))}
                    />

                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full">

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="total_cost">Costo de compra total</Label>
                    <Input
                      type="number"
                      placeholder="Costo de compra total"
                      // disabled={!isEditing}
                      value={formData.purchase_cost_total || ""}
                      onChange={(e) => handleUpdateLotField("purchase_cost_total", Number(e.target.value))}
                    />

                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cost_per_unit">Costo por unidad</Label>
                    <Input
                      type="number"
                      placeholder="Costo por unidad"
                      // disabled={!isEditing}
                      value={formData.purchase_cost_per_unit || ""}
                      onChange={(e) => handleUpdateLotField("purchase_cost_per_unit", Number(e.target.value))}
                    />


                  </div>

                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="download_total_cost">Costo total de descarga</Label>
                    <Input
                      placeholder="Costo total de descarga"
                      // disabled={!isEditing}
                      type="number"
                      value={formData.download_total_cost || ""}
                      onChange={(e) => handleUpdateLotField("download_total_cost", Number(e.target.value))}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="download_cost_per_unit">Costo de descarga por unidad</Label>
                    <Input
                      placeholder="Costo de descarga por unidad"
                      // disabled={!isEditing}
                      type="number"
                      value={formData.download_cost_per_unit || ""}
                      onChange={(e) => handleUpdateLotField("download_cost_per_unit", Number(e.target.value))}
                    />
                  </div>

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
                    // disabled={!isEditing}
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


                <div className="flex flex-col gap-2">
                  <Label htmlFor="waste">Vacíos</Label>
                  <LotContainerSelector
                    disabled={false}
                    assignments={formData.lot_containers ?? []}
                    initialQuantity={formData.initial_stock_quantity || 0}
                    onChange={(next) =>
                      setFormData({
                        ...formData,
                        lot_containers: next,
                        has_lot_container: (next ?? []).some(
                          (a) => (Number(a?.quantity) || 0) > 0
                        ),
                      })
                    }
                  />
                </div>


                <div className="grid grid-cols-2 gap-4 w-full">




                  {/* <div className="flex flex-col gap-2 relative col-span-2">
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
                  </div> */}
                </div>
              </TabsContent>

              <TabsContent value="product" className="mt-4">
                {/* <CheckBoxesSelector
                  options={creationModeOptions}
                  selectedOption={creationMode}
                  onSelectOption={(value) => setCreationMode(value as CreationMode)}
                  disabled={!isEditing}
                /> */}

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
                    <CategorySelectorRoot disabled={true}
                      value={selectedProduct.category_id}
                      onChange={(id) =>
                        setSelectedProduct({ ...selectedProduct, category_id: id })
                      }>
                      <SelectCategory />
                    </CategorySelectorRoot>
                  </div>


                  <div className="flex flex-col gap-2">
                    <Label htmlFor="waste">Categoría</Label>


                    <SubCategorySelectorRoot value={selectedProduct.sub_category_id?.toString() ?? ""} onChange={(id) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        sub_category_id: id ? Number(id) : null,
                      })
                    } disabled={true}>
                      <SelectSubCategory />

                    </SubCategorySelectorRoot>

                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="waste">Marca</Label>

                    <BrandSelectorRoot disabled={true}
                      value={selectedProduct.brand_id?.toString() ?? ""}
                      onChange={(id) =>
                        setSelectedProduct({
                          ...selectedProduct,
                          brand_id: id ? Number(id) : null,
                        })
                      }>
                      <SelectBrand />
                    </BrandSelectorRoot>

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

                  <div className="w-full h-32 border border-dashed border-gray-300 rounded-md">
                    {selectedProduct.public_image_src ? (
                      <img src={selectedProduct.public_image_src} alt={selectedProduct.product_name} className="object-cover w-full h-full" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No hay imagen disponible
                      </div>
                    )}
                  </div>

                  {/* <ImageSelector
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
                    disabled={!isEditing}
                  /> */}
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
          {tab === 'lot' ? (
            Object.keys(selectedProduct).length > 0 && (
              <>
                <DialogClose asChild>
                  <Button disabled={loading} variant={"outline"} onClick={() => {
                    setSelectedProduct({} as Product);
                    setFormData(emptyLot);
                    setLotPrices([]);
                    setIsEditing(false);
                  }}>
                    Cancelar
                  </Button>
                </DialogClose>

                {/* {isEditing ? (
                <Button variant={"outline"} onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Modificar</Button>
              )} */}


                <Button disabled={loading} onClick={handleSubmit}>{
                  loading ? "Agregando..." : "Agregar"}</Button>

              </>
            )
          ) : (
            null
          )}


        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

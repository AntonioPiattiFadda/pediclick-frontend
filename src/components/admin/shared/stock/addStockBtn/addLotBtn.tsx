import { adaptProductForDb } from "@/adapters/products";
import { Accordion } from "@/components/ui/accordion";
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
import type { LotContainersLocation } from "@/types/lotContainersLocation";
import type { Lot } from "@/types/lots";
import type { Price } from "@/types/prices";
import type { ProductPresentation } from "@/types/product_presentation";
import type { Product } from "@/types/products";
import type { Stock } from "@/types/stocks";
import { formatSmartNumber } from "@/utils";
import { DialogClose } from "@radix-ui/react-dialog";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import toast from 'react-hot-toast';
import { emptyLot } from "../../emptyFormData";
import { CreateProductPresentation, ProductPresentationSelectorRoot, SelectProductPresentation } from "../../selectors/productPresentationSelector";
import ProductSelector from "../../selectors/productSelector";
import { ProductEditSheet } from "../productEditSheet";
import PricesAccordion from "./pricesAccordion";
import StockAssignationContainer from "./XXstockAssignationContainer";
import { Card } from "@/components/ui/card";

// import ManageStockPrices from "./manageStockPrices";

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
  onAddElement: (lot: Lot, stock: Stock[], lotContainersLocation: LotContainersLocation[]) => void;
  loading?: boolean;
}) {
  // const [creationMode, setCreationMode] = useState<CreationMode>("SHORT");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<Lot>(emptyLot);
  const [stock, setStock] = useState<Stock[]>([]);
  console.log(stock);
  const [lotContainersLocation, setLotContainersLocation] = useState<LotContainersLocation[]>([]);
  console.log(lotContainersLocation);

  const [selectedProduct, setSelectedProduct] = useState<Product>({} as Product);
  const [selectedProductPresentation, setSelectedProductPresentation] = useState<ProductPresentation | null>(null);

  // console.log({ selectedProduct });

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
    const adaptedStock = stock.map(s => ({
      ...s,
      product_id: selectedProduct.product_id!,
      lot_id: formData.lot_id!,
    }));

    const adaptedLotContainersLocation = lotContainersLocation.map(loc => ({
      ...loc,
      lot_id: formData.lot_id!,
    }));
    onAddElement({
      ...formData,
      product_name: selectedProduct.product_name,
      product_id: selectedProduct.product_id,
      product_presentation_id: selectedProductPresentation?.product_presentation_id || null,
      prices: lotPrices,
    } as Lot, adaptedStock as Stock[], adaptedLotContainersLocation as LotContainersLocation[]);

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
    setSelectedProductPresentation(null);
    setStock([]);
    setLotContainersLocation([]);

  };

  const handleUpdateLotField = (field: string, rawValue: number | string) => {
    // determinamos si el campo debe tratarse como numérico
    const isNumericField = [
      "initial_stock_quantity",
      "purchase_cost_per_unit",
      "purchase_cost_total",
      "download_total_cost",
      "download_cost_per_unit",
      "delivery_cost_total",
      "delivery_cost_per_bulk",
      "delivery_cost_per_unit",
      "productor_commission_percentage",
      "productor_commission_unit_value",
    ].includes(field);

    // si es numérico, convertimos; si no, dejamos el valor tal cual
    const value = isNumericField ? (Number(rawValue) || 0) : rawValue;

    // valores actuales (default 0 si son null/undefined)
    const currentInitialStock = formData.initial_stock_quantity ?? 0;


    const bulkQuantityEquivalence = selectedProductPresentation?.bulk_quantity_equivalence ?? 0;

    const currentTotalCost = formData.purchase_cost_total ?? 0;
    const currentCostPerUnit = formData.purchase_cost_per_unit ?? 0;
    const currentCostPerBulk = formData.purchase_cost_per_bulk ?? 0;

    const currentDownloadTotalCost = formData.download_total_cost ?? 0;
    const currentDownloadCostPerUnit = formData.download_cost_per_unit ?? 0;
    const currentDownloadCostPerBulk = formData.download_cost_per_bulk ?? 0;


    const currentDeliveryCostTotal = formData.delivery_cost_total ?? 0;
    const currentDeliveryCostPerBulk = formData.delivery_cost_per_bulk ?? 0;
    const currentDeliveryCostPerUnit = formData.delivery_cost_per_unit ?? 0;



    let newInitialStock = currentInitialStock;

    let newTotalCost = currentTotalCost;
    let newCostPerUnit = currentCostPerUnit;
    let newCostPerBulk = currentCostPerBulk;

    let newDownloadTotalCost = currentDownloadTotalCost;
    let newDownloadCostPerUnit = currentDownloadCostPerUnit;
    let newDownloadCostPerBulk = currentDownloadCostPerBulk;

    let newDeliveryCostTotal = currentDeliveryCostTotal;
    let newDeliveryCostPerBulk = currentDeliveryCostPerBulk;
    let newDeliveryCostPerUnit = currentDeliveryCostPerUnit;

    const validStock =
      currentInitialStock !== null && currentInitialStock > 0;
    const validBulkEquiv =
      bulkQuantityEquivalence !== null && bulkQuantityEquivalence > 0;

    switch (field) {
      case "initial_stock_quantity":
        newInitialStock = value as number;

        // if (newInitialStock <= 0) {
        //   // si borra el stock → todo a 0
        //   newTotalCost = 0;
        //   newCostPerUnit = 0;
        //   newDownloadTotalCost = 0;
        //   newDownloadCostPerUnit = 0;
        // } else {
        //   // --- Compra ---
        //   if (currentCostPerUnit > 0) {
        //     newTotalCost = newInitialStock * currentCostPerUnit;
        //   } else if (currentTotalCost > 0) {
        //     newCostPerUnit = currentTotalCost / newInitialStock;
        //   }

        //   // --- Descarga ---
        //   if (currentDownloadCostPerUnit > 0) {
        //     newDownloadTotalCost = newInitialStock * currentDownloadCostPerUnit;
        //   } else if (currentDownloadTotalCost > 0) {
        //     newDownloadCostPerUnit = currentDownloadTotalCost / newInitialStock;
        //   }
        // }
        break;

      case "purchase_cost_per_unit": {
        newCostPerUnit = value as number;

        if (!validStock || !validBulkEquiv || !value || value as number <= 0) break;

        newCostPerBulk = value as number * bulkQuantityEquivalence;
        newTotalCost = newCostPerBulk * currentInitialStock;
        break;
      }
      case "purchase_cost_per_bulk": {
        newCostPerBulk = value as number;
        if (!validStock || !validBulkEquiv || !value || value as number <= 0) break;

        newCostPerUnit = value as number / bulkQuantityEquivalence;
        newTotalCost = value as number * currentInitialStock;
        break;
      }
      case "purchase_cost_total": {
        newTotalCost = value as number;
        if (!validStock || !validBulkEquiv || !value || value as number <= 0) break;

        newCostPerBulk = value as number / currentInitialStock;
        newCostPerUnit = newCostPerBulk / bulkQuantityEquivalence;
        break;
      }
        newTotalCost = value as number;

        if (newTotalCost <= 0) {
          // si borra costo total → costo unitario a 0
          newCostPerUnit = 0;
        } else if (currentInitialStock > 0) {
          newCostPerUnit = newTotalCost / currentInitialStock;
        }
        break;

      case "download_cost_per_unit": {
        newDownloadCostPerUnit = value as number;
        if (!validStock || !validBulkEquiv || !value || value as number <= 0) break;

        newDownloadCostPerBulk = value as number * bulkQuantityEquivalence;
        newDownloadTotalCost = newDownloadCostPerBulk * currentInitialStock;
        break;
      }

      case "download_cost_per_bulk": {
        newDownloadCostPerBulk = value as number;
        if (!validStock || !validBulkEquiv || !value || value as number <= 0) break;

        newDownloadCostPerUnit = value as number / bulkQuantityEquivalence;
        newDownloadTotalCost = value as number * currentInitialStock;
        break;
      }
      case "download_total_cost": {
        newDownloadTotalCost = value as number;
        if (!validStock || !validBulkEquiv || !value || value as number <= 0) break;
        console.log({ currentInitialStock });
        console.log({ value });
        newDownloadCostPerBulk = value as number / currentInitialStock;
        newDownloadCostPerUnit = newDownloadCostPerBulk / bulkQuantityEquivalence;

        console.log({ newDownloadCostPerBulk, newDownloadCostPerUnit });
        break;
      }
      case "productor_commission_type":
        // este campo es string, no numérico
        setFormData(prev => ({
          ...prev,
          productor_commission_type: value as Lot["productor_commission_type"],
          productor_commission_percentage: null,
          productor_commission_unit_value: null,
        }));
        return; // salimos para no aplicar los cálculos numéricos

      case "delivery_cost_per_unit": {
        newDeliveryCostPerUnit = value as number;
        if (!validStock || !validBulkEquiv || !value || value as number <= 0) break;

        newDeliveryCostPerBulk = value as number * bulkQuantityEquivalence;
        newDeliveryCostTotal = newDeliveryCostPerBulk * currentInitialStock;
        break;
      }

      case "delivery_cost_per_bulk": {
        newDeliveryCostPerBulk = value as number;
        if (!validStock || !validBulkEquiv || !value || value as number <= 0) break;

        newDeliveryCostPerUnit = value as number / bulkQuantityEquivalence;
        newDeliveryCostTotal = value as number * currentInitialStock;
        break;
      }

      case "delivery_cost_total": {
        newDeliveryCostTotal = value as number;
        if (!validStock || !validBulkEquiv || !value || value as number <= 0) break;

        newDeliveryCostPerBulk = value as number / currentInitialStock;
        newDeliveryCostPerUnit = newDeliveryCostPerBulk / bulkQuantityEquivalence;
        break;
      }


      case "purchasing_agent_commision_type":
        // este campo es string, no numérico
        setFormData(prev => ({
          ...prev,
          purchasing_agent_commision_type: value as Lot["purchasing_agent_commision_type"],
          purchasing_agent_commision_percentage: null,
          purchasing_agent_commision_unit_value: null,
        }));
        return; // salimos para no aplicar los cálculos numéricos

    }

    let final_cost_total: number | null = newTotalCost + newDownloadTotalCost + newDeliveryCostTotal;
    let final_cost_per_unit: number | null = newCostPerUnit + newDownloadCostPerUnit + newDeliveryCostPerUnit;
    let final_cost_per_bulk: number | null = newCostPerBulk + newDownloadCostPerBulk + newDeliveryCostPerBulk;

    if (!bulkQuantityEquivalence) {
      final_cost_per_bulk = null;
      final_cost_total = null;
      final_cost_per_unit = null;
    }

    // actualizamos el formData con los nuevos valores calculados
    setFormData(prev => ({
      ...prev,
      initial_stock_quantity: newInitialStock,


      purchase_cost_total: formatSmartNumber(newTotalCost),
      purchase_cost_per_unit: formatSmartNumber(newCostPerUnit),
      purchase_cost_per_bulk: formatSmartNumber(newCostPerBulk),


      download_total_cost: formatSmartNumber(newDownloadTotalCost),
      download_cost_per_bulk: formatSmartNumber(newDownloadCostPerBulk),
      download_cost_per_unit: formatSmartNumber(newDownloadCostPerUnit),

      delivery_cost_total: formatSmartNumber(newDeliveryCostTotal),
      delivery_cost_per_bulk: formatSmartNumber(newDeliveryCostPerBulk),
      delivery_cost_per_unit: formatSmartNumber(newDeliveryCostPerUnit),

      final_cost_total: formatSmartNumber(final_cost_total || 0),
      final_cost_per_unit: formatSmartNumber(final_cost_per_unit || 0),
      final_cost_per_bulk: formatSmartNumber(final_cost_per_bulk || 0),
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
          }  flex  flex-col gap-2 w-[950px] overflow-y-auto max-h-[90vh] min-h-[500px]`}
      >
        <DialogHeader>
          <DialogTitle className="flex flex-row gap-2 items-center">
            {isEditing
              ? "Editando producto"
              : `${selectedProduct.product_name
                ? "Agregar stock a Producto: " + selectedProduct.product_name
                : "Elegir producto"
              }`}
            {selectedProduct?.public_image_src && (
              <div>
                <img className="w-6 h-6" src={selectedProduct?.public_image_src || ""} />
              </div>
            )}
            {selectedProduct.product_id && (
              <div className="mx-auto">
                <ProductEditSheet
                  product={selectedProduct}
                  onUpdated={(updated) => setSelectedProduct(updated)}
                />
              </div>
            )}
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


        {isProductSelected ? (
          <>
            <Accordion type="multiple" className="w-full">
              {/* <ProductInfoAccordion
                product={selectedProduct}
                onChangeSelectedProduct={(updated) => setSelectedProduct(updated)}
              /> */}

              <div className="mt-2">
                <ProductPresentationSelectorRoot
                  productId={selectedProduct.product_id!}
                  value={selectedProductPresentation}
                  onChange={setSelectedProductPresentation}
                >
                  <SelectProductPresentation />
                  <CreateProductPresentation />
                </ProductPresentationSelectorRoot>
              </div>


              <PricesAccordion
                productPresentationId={selectedProductPresentation?.product_presentation_id ?? null}
                finalCost={{
                  final_cost_total: formData?.final_cost_total || null,
                  final_cost_per_unit: formData?.final_cost_per_unit || null,
                  final_cost_per_bulk: formData?.final_cost_per_bulk || null,
                }}
              />



            </Accordion>


            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-2">
                <Label htmlFor="initial_stock_quantity">Stock nuevo</Label>
                <Input
                  type="number"
                  placeholder="--"
                  // disabled={!isEditing}
                  value={formData.initial_stock_quantity || undefined}
                  onChange={(e) => handleUpdateLotField("initial_stock_quantity", Number(e.target.value))}
                />

              </div>
            </div>




            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className=" w-full">
                <TabsTrigger value="lot">Costos</TabsTrigger>
                {/* <TabsTrigger value="prices">Precios</TabsTrigger> */}
                <TabsTrigger value="stock">Asignación</TabsTrigger>

              </TabsList>


              <TabsContent value="lot" className="flex flex-col gap-2 mt-2">
                <Card className="border-none p-2 shadow-none bg-transparent">

                  {/* <div className="grid grid-cols-2 gap-4 w-full">
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
                      placeholder="Stock nuevo"
                      // disabled={!isEditing}
                      value={formData.initial_stock_quantity || undefined}
                      onChange={(e) => handleUpdateLotField("initial_stock_quantity", Number(e.target.value))}
                      />
                      
                      </div> 
                      
                      <div className="flex flex-col gap-2">
                      <Label htmlFor="bulk_quantity_equivalence">Cantidad por bulto</Label>
                      <div className=" gap-2">
                      <Input
                      placeholder="Cantidad por bulto"
                      // disabled={!isEditing}
                      type="number"
                      value={selectedProductPresentation?.bulk_quantity_equivalence ?? ""}
                      onChange={(e) =>
                      setFormData({
                        ...formData,
                        bulk_quantity_equivalence: e.target.value === "" ? null : Number(e.target.value),
                        })
                        }
                        />
                        </div>
                        </div> 
                        
                        </div> */}



                  <div className="grid grid-cols-3 gap-4 w-full">

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="purchase_cost_total">Costo neto total</Label>
                      <Input
                        type="number"
                        placeholder="Costo neto total"
                        // disabled={!isEditing}
                        value={formData.purchase_cost_total || undefined}
                        onChange={(e) => handleUpdateLotField("purchase_cost_total", Number(e.target.value))}
                      />

                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="cost_per_unit">Costo neto por bulto</Label>
                      <Input
                        type="number"
                        placeholder="Costo neto por bulto"
                        // disabled={!isEditing}
                        value={formData.purchase_cost_per_bulk || undefined}
                        onChange={(e) => handleUpdateLotField("purchase_cost_per_bulk", Number(e.target.value))}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="cost_per_unit">Costo neto por unidad/Kg</Label>
                      <Input
                        type="number"
                        placeholder="Costo neto por unidad/Kg"
                        // disabled={!isEditing}
                        value={formData.purchase_cost_per_unit || undefined}
                        onChange={(e) => handleUpdateLotField("purchase_cost_per_unit", Number(e.target.value))}
                      />


                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 w-full">

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="delivery_cost_total">Costo de envio total</Label>
                      <Input
                        type="number"
                        placeholder="Costo de envio total"
                        // disabled={!isEditing}
                        value={formData.delivery_cost_total || undefined}
                        onChange={(e) => handleUpdateLotField("delivery_cost_total", Number(e.target.value))}
                      />

                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="cost_per_unit">Costo de envio por bulto</Label>
                      <Input
                        type="number"
                        placeholder="Costo de envio por bulto"
                        // disabled={!isEditing}
                        value={formData.delivery_cost_per_bulk || undefined}
                        onChange={(e) => handleUpdateLotField("delivery_cost_per_bulk", Number(e.target.value))}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="cost_per_unit">Costo de envio por unidad/Kg</Label>
                      <Input
                        type="number"
                        placeholder="Costo de envio por unidad/Kg"
                        // disabled={!isEditing}
                        value={formData.delivery_cost_per_unit || undefined}
                        onChange={(e) => handleUpdateLotField("delivery_cost_per_unit", Number(e.target.value))}
                      />


                    </div>

                  </div>

                  <div className="grid grid-cols-3 gap-4 w-full">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="download_total_cost">Costo total de descarga</Label>
                      <Input
                        placeholder="Costo total de descarga"
                        // disabled={!isEditing}
                        type="number"
                        value={formData.download_total_cost || undefined}
                        onChange={(e) => handleUpdateLotField("download_total_cost", Number(e.target.value))}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="download_cost_per_bulk">Costo de descarga por bulto</Label>
                      <Input
                        placeholder="Costo de descarga por bulto"
                        // disabled={!isEditing}
                        type="number"
                        value={formData.download_cost_per_bulk || undefined}
                        onChange={(e) => handleUpdateLotField("download_cost_per_bulk", Number(e.target.value))}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="download_cost_per_unit">Costo de descarga por unidad/Kg</Label>
                      <Input
                        placeholder="Costo de descarga por unidad/Kg"
                        // disabled={!isEditing}
                        type="number"
                        value={formData.download_cost_per_unit || undefined}
                        onChange={(e) => handleUpdateLotField("download_cost_per_unit", Number(e.target.value))}
                      />
                    </div>

                  </div>

                  {/* <Accordion
                  type="single"
                  collapsible
                  className="w-full mb-2"
                  defaultValue=""
                  >
                  <AccordionItem value="item-1">
                  <AccordionTrigger>Comisiones</AccordionTrigger>
                  <AccordionContent className="flex flex-col gap-4 text-balance">
                  
                  <div className="grid grid-cols-3 gap-4 w-full">
                  <div className="flex flex-col gap-2 -mt-2">
                  <Label className="mt-2">Comprador</Label>
                  <PurchasingAgentSelectorRoot
                  value={formData.purchasing_agent_id}
                  onChange={(value) =>
                  setFormData({ ...formData, purchasing_agent_id: value })
                  }
                  disabled={false}>
                  <SelectPurchasingAgent />
                  <CreatePurchasingAgent />
                  </PurchasingAgentSelectorRoot>
                  
                  </div>
                  
                  
                  <div className="flex flex-col gap-2">
                  <Label htmlFor="purchasing_agent_commision_type">Tipo de comisión del comprador</Label>
                  <Select
                  value={formData.purchasing_agent_commision_type || undefined}
                  onValueChange={(value) => handleUpdateLotField("purchasing_agent_commision_type", value)}>
                  <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tipo de comisión del comprador" />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectGroup>
                  <SelectLabel>Tipo de comision</SelectLabel>
                  <SelectItem value="TOTAL_PERCENTAGE">Porcentaje</SelectItem>
                  <SelectItem value="BY_UNIT">Por Unidad</SelectItem>
                  <SelectItem value="NONE">Ninguno</SelectItem>
                  </SelectGroup>
                  </SelectContent>
                  </Select>
                  </div>
                  
                  
                  {formData.purchasing_agent_commision_type === "BY_UNIT" && (
                    <div className="flex flex-col gap-2">
                    <Label htmlFor="purchasing_agent_commision_unit_value">Valor por unidad</Label>
                    <Input
                    placeholder="Valor por unidad"
                    // disabled={!isEditing}
                    type="number"
                    value={formData.purchasing_agent_commision_unit_value || undefined}
                    onChange={(e) => handleUpdateLotField("purchasing_agent_commision_unit_value", Number(e.target.value))}
                    />
                    </div>
                    )}
                    
                    {formData.purchasing_agent_commision_type === "TOTAL_PERCENTAGE" && (
                      <div className="flex flex-col gap-2">
                      <Label htmlFor="purchasing_agent_commision_percentage">Porcentaje de comisión</Label>
                      <Input
                      placeholder="Porcentaje de comisión"
                      // disabled={!isEditing}
                      type="number"
                      value={formData.purchasing_agent_commision_percentage || undefined}
                      onChange={(e) => handleUpdateLotField("purchasing_agent_commision_percentage", Number(e.target.value))}
                      />
                      </div>
                      )}
                      
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 w-full">
                      
                      <div className="flex flex-col gap-2 -mt-2">
                      <Label className="mt-2">Productor</Label>
                      <PurchasingAgentSelectorRoot value={formData.purchasing_agent_id}
                      onChange={(value) =>
                      setFormData({ ...formData, purchasing_agent_id: value })
                      }
                      disabled={false}>
                      <SelectPurchasingAgent />
                      <CreatePurchasingAgent />
                      </PurchasingAgentSelectorRoot>
                      
                      </div>
                      
                            <div className="flex flex-col gap-2">
                            <Label htmlFor="productor_commission_type">Tipo de comisión del productor</Label>
                            <Select
                            value={formData.productor_commission_type || undefined}
                            onValueChange={(value) => handleUpdateLotField("productor_commission_type", value)}>
                            <SelectTrigger className="w-full">
                            <SelectValue placeholder="Tipo de comisión del productor" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectGroup>
                            <SelectLabel>Tipo de comision</SelectLabel>
                            <SelectItem value="TOTAL_PERCENTAGE">Porcentaje</SelectItem>
                            <SelectItem value="BY_UNIT">Por Unidad</SelectItem>
                            <SelectItem value="NONE">Ninguno</SelectItem>
                            </SelectGroup>
                            </SelectContent>
                            </Select>
                            </div>
                            
                            {formData.productor_commission_type === "BY_UNIT" && (
                              <div className="flex flex-col gap-2">
                              <Label htmlFor="productor_commission_unit_value">Valor por unidad</Label>
                              <Input
                              placeholder="Valor por unidad"
                              // disabled={!isEditing}
                              type="number"
                              value={formData.productor_commission_unit_value || undefined}
                              onChange={(e) => handleUpdateLotField("productor_commission_unit_value", Number(e.target.value))}
                              />
                              </div>
                              )}
                              {formData.productor_commission_type === "TOTAL_PERCENTAGE" && (
                                <div className="flex flex-col gap-2">
                                <Label htmlFor="productor_commission_percentage">Porcentaje de comisión</Label>
                                <Input
                                placeholder="Porcentaje de comisión"
                                // disabled={!isEditing}
                                type="number"
                                value={formData.productor_commission_percentage || undefined}
                                onChange={(e) => handleUpdateLotField("productor_commission_percentage", Number(e.target.value))}
                                />
                                </div>
                                )}
                                
                                </div>
                                
                                
                                
                                </AccordionContent>
                                </AccordionItem>
                                
                                </Accordion> */}



                  {/* 
                
                productor_commission_type: CommissionType; // Radio button
                
                productor_commission_percentage: number | null; // Input tipo numero, solo si productor_commission_type es BY_UNIT
                productor_commission_unit_value: number | null; // Input tipo numero, solo si productor_commission_type es FIXED
                
                purchasing_agent_id: number | null; // Selector de comprador
                purchasing_agent_commision_type: w; // Radio button
                purchasing_agent_commision_percentage: number | null; // Input tipo numero, solo si purchasing_agent_commision_type es TOTAL_PERCENTAGE
                purchasing_agent_commision_unit_value: number | null; // Input tipo numero, solo si purchasing_agent_commision_type es FIXED */}



                  <div className="grid grid-cols-2 gap-4 w-full">

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

                    {/* <div className="flex flex-col gap-2">
                    <Label htmlFor="delivery_price">Costo de entrega</Label>
                    <Input
                    placeholder="Costo de entrega"
                    // disabled={!isEditing}
                    type="number"
                    value={formData.delivery_price || undefined}
                    onChange={(e) => handleUpdateLotField("delivery_price", Number(e.target.value))}
                    />
                    </div> */}

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
                </Card>
              </TabsContent>



              <TabsContent value="stock" className="flex flex-col gap-2 mt-2">
                <StockAssignationContainer
                  disabled={false}
                  initial_stock_quantity={formData.initial_stock_quantity || 0}
                  stock={stock}
                  onChangeStock={(nextStock) => {
                    setStock(nextStock)
                  }}
                  lotContainersLocations={lotContainersLocation}
                  onChangeLotContainersLocations={(newLotContainers: LotContainersLocation[]) => {
                    setLotContainersLocation(newLotContainers);
                  }}
                />


              </TabsContent>

            </Tabs>
          </>
        ) : (
          <div className="w-full h-full text-center  my-auto">
            Seleccionar un producto
          </div>
        )
        }

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
          )}

        </DialogFooter>
      </DialogContent >
    </Dialog >
  );
}


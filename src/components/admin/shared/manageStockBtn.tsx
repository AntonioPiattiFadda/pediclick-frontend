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
import type { Lot } from "@/types/lots";
import { Barcode, ChevronRight } from "lucide-react";
import { useState } from "react";
import { LotContainerSelector } from "../addLoadOrder/lotContainerSelector";
import { BrandSelectorRoot, SelectBrand } from "./brandSelector";
import { CategorySelectorRoot, SelectCategory } from "./categorySelector";
import { emptyLot } from "./emptyFormData";
import { SelectSubCategory, SubCategorySelectorRoot } from "./subCategorySelector";


import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";



import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProduct } from "@/service/products";
import { useQuery } from "@tanstack/react-query";
import { CreatePurchasingAgent, PurchasingAgentSelectorRoot, SelectPurchasingAgent } from "./purchasingAgentSelector";
import DisposeWaste from "./DisposeWaste";
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

export function ManageStockBtn({
  productId,
}: {
  productId: number;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Lot>(emptyLot);

  // const queryClient = useQueryClient();

  const { data: selectedProduct, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const response = await getProduct(productId);
      return response.product;
    },
    enabled: isModalOpen && !!productId,
  });

  console.log({ selectedProduct });
  // const [lotPrices, setLotPrices] = useState<Price[]>([]);
  const [tab, setTab] = useState("lot");

  // const handleSubmit = () => {
  //   if (!isProductSelected) {
  //     toast('Debes seleccionar un producto para agregar al remito');
  //     return
  //   };
  //   //TODO ACTUALIZAR PRODUCTO SI ESTA EN MODO EDICION
  //   //TODO AGREGAR AL REMITO
  //   onAddElement({
  //     ...formData,
  //     product_name: selectedProduct.product_name,
  //     product_id: selectedProduct.product_id,
  //     prices: lotPrices,
  //   } as Lot);

  //   if (!loading) {
  //     handleClose();
  //   }
  // };

  // const handleClose = () => {
  //   setIsModalOpen(false);
  //   setIsEditing(false);
  //   setSelectedProduct(adaptProductForDb({} as Product));
  //   setLotPrices([]);
  //   setFormData(emptyLot);
  // };

  if (isLoading) {
    return <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost">
          <ChevronRight className="mr-2 h-4 w-4" />

        </Button>
      </DialogTrigger>
      <DialogContent
        className={`border-4 border-transparent  flex  flex-col gap-2 w-[750px] overflow-y-auto max-h-[90vh] min-h-[500px]`}
      ></DialogContent>
    </Dialog>
  }

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


    const bulkQuantityEquivalence = formData.bulk_quantity_equivalence ?? 0;

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

    // actualizamos el formData con los nuevos valores calculados
    setFormData(prev => ({
      ...prev,
      initial_stock_quantity: newInitialStock,


      purchase_cost_total: newTotalCost,
      purchase_cost_per_unit: newCostPerUnit,
      purchase_cost_per_bulk: newCostPerBulk,


      download_total_cost: newDownloadTotalCost,
      download_cost_per_bulk: newDownloadCostPerBulk,
      download_cost_per_unit: newDownloadCostPerUnit,

      delivery_cost_total: newDeliveryCostTotal,
      delivery_cost_per_bulk: newDeliveryCostPerBulk,
      delivery_cost_per_unit: newDeliveryCostPerUnit,
    }));
  };



  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost">
          <ChevronRight className="mr-2 h-4 w-4" />

        </Button>
      </DialogTrigger>
      <DialogContent
        className={`border-4 border-transparent  flex  flex-col gap-2 w-[750px] overflow-y-auto max-h-[90vh] min-h-[500px]`}
      >
        <DialogHeader>
          <DialogTitle>
            {`Manejar stock a Producto: ${selectedProduct?.product_name}`}
          </DialogTitle>
          {/* <DialogDescription>
            Completá la información del nuevo elemento que querés publicar.
          </DialogDescription> */}
        </DialogHeader>


        {/* <ProductSelector
          value={selectedProduct.product_id || 0}
          onChange={setSelectedProduct}
        /> */}


        <RadioGroup className="flex gap-2 my-4">
          <div className="flex items-center gap-3">
            <RadioGroupItem value="all" />
            <Label htmlFor="r3">Todos los lotes</Label>
          </div>
          {selectedProduct?.lots?.length && selectedProduct?.lots.map((lot, idx) => (
            <div className="flex items-center gap-3" key={lot?.lot_id ?? `lot-${idx}`}>
              <RadioGroupItem value={lot?.lot_id?.toString() ?? ""} id={`r-${lot?.lot_id ?? ""}`} />
              <Label htmlFor={`r-${lot?.lot_id ?? ""}`}>{`Lote ${lot?.lot_id ?? ""}`}</Label>
              <DisposeWaste lotId={lot?.lot_id ?? 0} />

            </div>
          ))}
        </RadioGroup>






        <>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="lot">Lote</TabsTrigger>
              <TabsTrigger value="product">Producto</TabsTrigger>
              <TabsTrigger value="prices">Precios</TabsTrigger>
              <TabsTrigger value="sto">Stock</TabsTrigger>
              <TabsTrigger value="transfer">Transformación</TabsTrigger>
            </TabsList>
            {tab === "product" && (
              <div className="mt-2">
                {/* <ProductEditSheet
                    product={selectedProduct}
                    onUpdated={(updated) => setSelectedProduct(updated)}
                  /> */}
              </div>
            )}

            <TabsContent value="lot" className="flex flex-col gap-2 mt-2">
              <div className="grid grid-cols-3 gap-4 w-full">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="lot_number">Nro de Lote</Label>
                  <div className="grid grid-cols-[1fr_50px] gap-2">
                    <Input
                      placeholder="Nro de Lote"
                      // disabled={true}
                      type="number"
                      value={formData.lot_number ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lot_number: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                    {/* <GetFollowingLotNumberBtn onClick={(nextLotNumber) => {
                      setFormData({
                        ...formData,
                        lot_number: nextLotNumber,
                      });
                    }}
                      productId={selectedProduct?.product_id}
                    /> */}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="initial_stock_quantity">Stock nuevo</Label>
                  <Input
                    type="number"
                    placeholder="Stock nuevo"
                    // disabled={true}
                    value={formData.initial_stock_quantity || undefined}
                    onChange={(e) => handleUpdateLotField("initial_stock_quantity", Number(e.target.value))}
                  />

                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="bulk_quantity_equivalence">Cantidad por bulto</Label>
                  <div className=" gap-2">
                    <Input
                      placeholder="Cantidad por bulto"
                      // disabled={true}
                      type="number"
                      value={formData.bulk_quantity_equivalence ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bulk_quantity_equivalence: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

              </div>



              <div className="grid grid-cols-3 gap-4 w-full">

                <div className="flex flex-col gap-2">
                  <Label htmlFor="purchase_cost_total">Costo neto total</Label>
                  <Input
                    type="number"
                    placeholder="Costo neto total"
                    // disabled={true}
                    value={formData.purchase_cost_total || undefined}
                    onChange={(e) => handleUpdateLotField("purchase_cost_total", Number(e.target.value))}
                  />

                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="cost_per_unit">Costo neto por bulto</Label>
                  <Input
                    type="number"
                    placeholder="Costo neto por bulto"
                    // disabled={true}
                    value={formData.purchase_cost_per_bulk || undefined}
                    onChange={(e) => handleUpdateLotField("purchase_cost_per_bulk", Number(e.target.value))}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="cost_per_unit">Costo neto por unidad/Kg</Label>
                  <Input
                    type="number"
                    placeholder="Costo neto por unidad/Kg"
                    // disabled={true}
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
                    // disabled={true}
                    value={formData.delivery_cost_total || undefined}
                    onChange={(e) => handleUpdateLotField("delivery_cost_total", Number(e.target.value))}
                  />

                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="cost_per_unit">Costo de envio por bulto</Label>
                  <Input
                    type="number"
                    placeholder="Costo de envio por bulto"
                    // disabled={true}
                    value={formData.delivery_cost_per_bulk || undefined}
                    onChange={(e) => handleUpdateLotField("delivery_cost_per_bulk", Number(e.target.value))}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="cost_per_unit">Costo de envio por unidad/Kg</Label>
                  <Input
                    type="number"
                    placeholder="Costo de envio por unidad/Kg"
                    // disabled={true}
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
                    // disabled={true}
                    type="number"
                    value={formData.download_total_cost || undefined}
                    onChange={(e) => handleUpdateLotField("download_total_cost", Number(e.target.value))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="download_cost_per_bulk">Costo de descarga por bulto</Label>
                  <Input
                    placeholder="Costo de descarga por bulto"
                    // disabled={true}
                    type="number"
                    value={formData.download_cost_per_bulk || undefined}
                    onChange={(e) => handleUpdateLotField("download_cost_per_bulk", Number(e.target.value))}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="download_cost_per_unit">Costo de descarga por unidad/Kg</Label>
                  <Input
                    placeholder="Costo de descarga por unidad/Kg"
                    // disabled={true}
                    type="number"
                    value={formData.download_cost_per_unit || undefined}
                    onChange={(e) => handleUpdateLotField("download_cost_per_unit", Number(e.target.value))}
                  />
                </div>

              </div>

              <Accordion
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
                            // disabled={true}
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
                            // disabled={true}
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
                            // disabled={true}
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
                            // disabled={true}
                            type="number"
                            value={formData.productor_commission_percentage || undefined}
                            onChange={(e) => handleUpdateLotField("productor_commission_percentage", Number(e.target.value))}
                          />
                        </div>
                      )}

                    </div>



                  </AccordionContent>
                </AccordionItem>

              </Accordion>



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
                    // disabled={true}
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
                      // disabled={true}
                      type="number"
                      value={formData.delivery_price || undefined}
                      onChange={(e) => handleUpdateLotField("delivery_price", Number(e.target.value))}
                    />
                  </div> */}

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


              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="lot_number">Código corto</Label>
                  <Input
                    placeholder="Código corto"
                    disabled={true}
                    type="number"
                    value={selectedProduct?.short_code ?? ""}


                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="flex gap-2" htmlFor="barcode">
                    Código de barras <Barcode height={14} />
                  </Label>
                  <Input
                    placeholder="barcode"
                    disabled={true}
                    type="number"
                    value={selectedProduct?.barcode ?? ""}

                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="waste">Rubro</Label>
                  <CategorySelectorRoot disabled={true}
                    value={selectedProduct?.category_id || 0}
                    onChange={() => {
                      return
                    }}>
                    <SelectCategory />
                  </CategorySelectorRoot>
                </div>


                <div className="flex flex-col gap-2">
                  <Label htmlFor="waste">Categoría</Label>


                  <SubCategorySelectorRoot value={selectedProduct?.sub_category_id?.toString() ?? ""} onChange={() => {
                    return
                  }} disabled={true}>
                    <SelectSubCategory />

                  </SubCategorySelectorRoot>

                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="waste">Marca</Label>

                  <BrandSelectorRoot disabled={true}
                    value={selectedProduct?.brand_id?.toString() ?? ""}
                    onChange={() => { return }
                    }>
                    <SelectBrand />
                  </BrandSelectorRoot>

                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="product_name">Nombre</Label>
                  <Input
                    placeholder="product_name"
                    disabled={true}
                    type="text"
                    value={selectedProduct?.product_name}

                  />
                </div>

                <div className="w-full h-32 border border-dashed border-gray-300 rounded-md">
                  {selectedProduct?.public_image_src ? (
                    <img src={selectedProduct?.public_image_src} alt={selectedProduct?.product_name} className="object-cover w-full h-full" />
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
                    disabled={true}
                  /> */}
                <div className="flex flex-col gap-2 col-span-2">
                  <Label htmlFor="observations">Observaciones</Label>
                  <Textarea
                    placeholder=""
                    disabled={true}
                    value={selectedProduct?.observations || undefined}

                  />
                </div>
              </div>





            </TabsContent>

            <TabsContent value="prices" className="mt-4">
              {/* <ManageStockPrices
                  // lotId={2}
                  // stockId={3}
                  // lotNumber={4}
                  // loadOrderId={5}
                  // value,
                  // onChange,

                  disabled={false}
                  storeId={0}
                  productId={selectedProduct.product_id!}
                  hasCost={false}
                /> */}

            </TabsContent>
          </Tabs>
        </>


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
          {/* {tab === 'lot' ? (
            Object.keys(selectedProduct).length > 0 && (
              <>
                <DialogClose asChild>
                  <Button variant={"outline"} onClick={() => {
                    setFormData(emptyLot);
                    setLotPrices([]);
                  }}>
                    Cancelar
                  </Button>
                </DialogClose>

            


        </>
        )
        ) : (
        null
          )} */}


        </DialogFooter>
      </DialogContent>
    </Dialog >
  );
}

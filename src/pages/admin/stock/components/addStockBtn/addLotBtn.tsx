import { adaptProductForDb } from "@/adapters/products";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import type { LotContainersStock } from "@/types/lotContainersStock";
import type { Lot } from "@/types/lots";
import type { ProductPresentation } from "@/types/productPresentation";
import type { Product } from "@/types/products";
import type { Stock } from "@/types/stocks";
import { formatSmartNumber } from "@/utils";
import { DialogClose } from "@radix-ui/react-dialog";
import { Info, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import toast from 'react-hot-toast';
import { emptyLot } from "../../../../../components/admin/emptyFormData";
import { CreateProductPresentation, ProductPresentationSelectorRoot, SelectProductPresentation } from "../../../../../components/admin/selectors/productPresentationSelector";
import ProductSelector from "../../../../../components/admin/selectors/productSelector";
import { ProductEditSheet } from "../../../../../components/admin/stock/productEditSheet";
import { MoneyInput } from "../../../../../components/admin/ui/MoneyInput";
import PricesAccordion from "./pricesAccordion";
import StockAssignationContainer from "./StockAssignationContainer";

// const formDev = {
//   lot_number: null,
//   expiration_date: null,
//   expiration_date_notification: false,
//   provider_id: null,
//   load_order_id: null,
//   product_id: 0,
//   has_lot_container: false,
//   is_parent_lot: false,
//   is_sold_out: false,
//   lot_containers: [],
//   initial_stock_quantity: 10,
//   purchase_cost_per_bulk: 500,
//   purchase_cost_total: 5000,
//   purchase_cost_per_unit: 1.39,
//   final_cost_total: 5000,
//   final_cost_per_bulk: 500,
//   final_cost_per_unit: 1.39,
//   download_total_cost: 0,
//   download_cost_per_bulk: 0,
//   download_cost_per_unit: 0,
//   delivery_cost_total: 0,
//   delivery_cost_per_unit: 0,
//   delivery_cost_per_bulk: 0,
//   productor_commission_type: 'NONE',
//   productor_commission_percentage: null,
//   productor_commission_unit_value: null,
//   purchasing_agent_id: null,
//   purchasing_agent_commision_type: 'NONE',
//   purchasing_agent_commision_percentage: null,
//   purchasing_agent_commision_unit_value: null,
//   : null,
//   is_expired: false,
//   lot_control: false,
//   product_presentation_id: null,
//   is_derived: false,
//   is_transformed: false,
//   quantity_transformed: null,
//   extra_cost_total: 0
// }

// const stockDev = [
//   {
//     stock_id: 494140,
//     lot_id: 963173,
//     is_new: true,
//     quantity: 10,
//     location_id: 3,
//     min_notification: null,
//     max_notification: null,
//     stock_type: undefined,
//     reserved_for_selling_quantity: null,
//     reserved_for_transferring_quantity: null,
//     transformed_from_product_id: null,
//     updated_at: null
//   }
// ]

// const locationStockDev = [
//   {
//     lot_container_stock_id: 1765159966776,
//     lot_container_id: null,
//     quantity: 10,
//     created_at: null,
//     location_id: null,
//     client_id: null,
//     provider_id: null,
//     lot_container_status: 'COMPLETED'
//   }
// ]

// const productDev = {
//   product_name: 'HUEVOS',
//   product_description: undefined,
//   allow_stock_control: undefined,
//   category_id: undefined,
//   sub_category_id: undefined,
//   short_code: 40,
//   barcode: undefined,
//   brand_id: undefined,
//   lot_control: undefined,
//   public_image_id: undefined,
//   observations: null,
//   sell_measurement_mode: null,
//   updated_at: null,
//   equivalence_minor_mayor_selling: { minor: null, mayor: null },
//   product_presentations: undefined,
//   product_id: 117,
//   public_image_src: null,
//   public_images: null,
//   categories: undefined,
//   sub_categories: undefined,
//   brands: undefined,
//   has_stock: false,
//   created_at: undefined,
//   nameAndCode: { name: 'HUEVOS', short_code: 40 }
// }

// const prodPresDev = {
//   product_presentation_id: 41,
//   created_at: '2025-11-10T22:46:57.859768+00:00',
//   product_presentation_name: 'CAJON',
//   short_code: 5,
//   product_id: 117,
//   organization_id: '3a145754-a901-46e1-8ad2-480f8968d8be',
//   deleted_at: null,
//   bulk_quantity_equivalence: 360,
//   updated_at: null
// }

export function AddLotBtn({
  onAddElement,
  loading = false,
}: {
  onAddElement: (lot: Lot, stock: Stock[], lotContainersStock: LotContainersStock[]) => void;
  loading?: boolean;
}) {



  // checkHasOverSell
  // const [creationMode, setCreationMode] = useState<CreationMode>("SHORT");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<Lot>(emptyLot);

  const [stock, setStock] = useState<Stock[]>([]);

  const [lotContainersStock, setLotContainersStock] = useState<LotContainersStock[]>([]);

  const [selectedProduct, setSelectedProduct] = useState<Product>({} as Product);

  const [selectedProductPresentation, setSelectedProductPresentation] = useState<Partial<ProductPresentation> | null>(null);

  const [tab, setTab] = useState("lot");

  // const isProductSelected = Boolean(selectedProduct.product_id);
  const isProductSelected = true;

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!loading) {
      handleClose();
    }
  }, [loading]);


  const handleSubmit = async () => {
    if (!isProductSelected) {
      toast('Debes seleccionar un producto para agregar al remito');
      return
    };

    if (!selectedProduct.product_id) {
      toast('Debes seleccionar un producto para agregar');
      return
    }

    if (!selectedProductPresentation?.product_presentation_id) {
      toast('Debes seleccionar una presentacion para agregar');
      return
    }

    // Quantities entered by the user are in presentation units (e.g. cajones).
    // Multiply by bulk_quantity_equivalence to get base units before sending to the backend.
    const equiv = selectedProductPresentation?.bulk_quantity_equivalence || 1;

    const adaptedStock = stock.map(s => ({
      ...s,
      product_id: selectedProduct.product_id!,
      lot_id: formData.lot_id!,
      quantity: (s.quantity || 0) * equiv,
    }));

    onAddElement({
      ...formData,
      product_name: selectedProduct.product_name,
      product_id: selectedProduct.product_id,
      initial_stock_quantity: (formData.initial_stock_quantity || 0) * equiv,
    } as Lot, adaptedStock as Stock[], [] as LotContainersStock[]);

    if (!loading) {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setSelectedProduct(adaptProductForDb({} as Product));
    setFormData(emptyLot);
    setSelectedProductPresentation(null);
    setStock([]);
    setLotContainersStock([]);

  };

  const handleUpdateLotField = (field: string, rawValue: number | string) => {
    // determinamos si el campo debe tratarse como numérico
    const isNumericField = [
      "initial_stock_quantity",
      "extra_cost_total",
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

    const currentExtraCostTotal = formData.extra_cost_total ?? 0;
    let newExtraCostTotal = currentExtraCostTotal;


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
        setLotContainersStock((prev) => {
          const lotCOntainerStockWithQuantityZero = prev.map((lcs) => {
            return {
              ...lcs,
              quantity: 0,
            }
          })
          return lotCOntainerStockWithQuantityZero;
        });

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
        newDownloadCostPerBulk = value as number / currentInitialStock;
        newDownloadCostPerUnit = newDownloadCostPerBulk / bulkQuantityEquivalence;

        break;
      }
      case "extra_cost_total": {
        newExtraCostTotal = value as number;
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

    // initial_stock_quantity is in presentation units (e.g. cajones).
    // extra_cost distributes per bulk first, then per unit = per_bulk / bulk_equiv.
    const extraPerBulk = newExtraCostTotal / (newInitialStock || 1);
    const extraPerUnit = extraPerBulk / (bulkQuantityEquivalence || 1);

    let final_cost_total: number | null = newTotalCost + newDownloadTotalCost + newDeliveryCostTotal + newExtraCostTotal;
    let final_cost_per_unit: number | null = newCostPerUnit + newDownloadCostPerUnit + newDeliveryCostPerUnit + extraPerUnit;
    let final_cost_per_bulk: number | null = newCostPerBulk + newDownloadCostPerBulk + newDeliveryCostPerBulk + extraPerBulk;

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

      extra_cost_total: formatSmartNumber(newExtraCostTotal),
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
            onChange={(value) => {
              setSelectedProduct({ ...selectedProduct, ...value })
              setStock([]);

            }

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
                  locationId={null}
                  productId={selectedProduct.product_id!}
                  value={selectedProductPresentation}
                  onChange={(value) => {
                    console.log("value", value);
                    // setLotContainersStock(emptyLotContainerStock)
                    setSelectedProductPresentation(value)
                    setStock([]);
                  }
                  }
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
                <Label htmlFor="initial_stock_quantity">
                  {selectedProductPresentation?.product_presentation_name
                    ? `Stock nuevo (en ${selectedProductPresentation.product_presentation_name})`
                    : "Stock nuevo"}
                </Label>
                <Input
                  type="number"
                  placeholder="--"
                  value={formData.initial_stock_quantity || undefined}
                  onChange={(e) => handleUpdateLotField("initial_stock_quantity", Number(e.target.value))}
                />
                {selectedProductPresentation?.bulk_quantity_equivalence && formData.initial_stock_quantity ? (
                  <p className="text-xs text-muted-foreground">
                    = {(formData.initial_stock_quantity || 0) * selectedProductPresentation.bulk_quantity_equivalence}{" "}
                    unidades base (kg)
                  </p>
                ) : null}
              </div>

              {/* <div className="flex flex-col gap-2">
                <LotContainerStock
                  lotContainersStock={lotContainersStock}
                  onChangeLotContainersStock={setLotContainersStock}
                  initialStock={formData.initial_stock_quantity}
                />
              </div> */}

            </div>





            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className=" w-full">
                <TabsTrigger value="lot">Costos</TabsTrigger>
                {/* <TabsTrigger value="prices">Precios</TabsTrigger> */}
                <TabsTrigger value="stock">Asignación</TabsTrigger>

              </TabsList>


              <TabsContent value="lot" className="flex flex-col gap-2 mt-2">


                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground text-center">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Para recalcular los costos <strong>automáticamente</strong> se requiere <strong>producto</strong>,{" "}
                    <strong>presentación</strong> y <strong>stock inicial</strong>.
                  </span>
                </div>

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
                    <MoneyInput
                      label="Costo neto total"
                      value={formData.purchase_cost_total || undefined}
                      placeholder="Costo neto total"
                      onChange={(v) => handleUpdateLotField("purchase_cost_total", Number(v))}
                    />

                    <MoneyInput
                      label="Costo neto por bulto"
                      placeholder="Costo neto por bulto"
                      // disabled={!isEditing}
                      value={formData.purchase_cost_per_bulk || undefined}
                      onChange={(v) => handleUpdateLotField("purchase_cost_per_bulk", Number(v))}
                    />

                    <MoneyInput
                      label="Costo neto por unidad/Kg"
                      placeholder="Costo neto por unidad/Kg"
                      // disabled={!isEditing}
                      value={formData.purchase_cost_per_unit || undefined}
                      onChange={(v) => handleUpdateLotField("purchase_cost_per_unit", Number(v))}
                    />

                  </div>

                  <div className="grid grid-cols-3 gap-4 w-full">


                    <MoneyInput
                      label="Costo de envío total"
                      value={formData.delivery_cost_total || undefined}
                      onChange={(v) =>
                        handleUpdateLotField("delivery_cost_total", v ?? 0)
                      }
                    />


                    <MoneyInput
                      label="Costo de envío por bulto"
                      value={formData.delivery_cost_per_bulk || undefined}
                      onChange={(v) =>
                        handleUpdateLotField("delivery_cost_per_bulk", v ?? 0)
                      }
                    />

                    <MoneyInput
                      label="Costo de envío por unidad / Kg"
                      value={formData.delivery_cost_per_unit || undefined}
                      onChange={(v) =>
                        handleUpdateLotField("delivery_cost_per_unit", v ?? 0)
                      }
                    />


                  </div>

                  <div className="grid grid-cols-3 gap-4 w-full">

                    <MoneyInput
                      label="Costo total de descarga"
                      value={formData.download_total_cost || undefined}
                      onChange={(v) =>
                        handleUpdateLotField("download_total_cost", v ?? 0)
                      }
                    />


                    <MoneyInput
                      label="Costo total de descarga por bulto"
                      value={formData.download_cost_per_bulk || undefined}
                      onChange={(v) =>
                        handleUpdateLotField("download_cost_per_bulk", v ?? 0)
                      }
                    />

                    <MoneyInput
                      label="Costo de descarga por unidad/Kg"
                      value={formData.download_cost_per_unit || undefined}
                      onChange={(v) =>
                        handleUpdateLotField("download_cost_per_unit", v ?? 0)
                      }
                    />


                  </div>


                  <div className="grid grid-cols-3 gap-4 w-full">
                    <MoneyInput
                      label="Costo extra total"
                      value={formData.extra_cost_total || undefined}
                      onChange={(v) =>
                        handleUpdateLotField("extra_cost_total", v ?? 0)
                      }
                    />


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
                  lotContainersStock={lotContainersStock}
                  onChangeLotContainersStock={(newLotContainers: LotContainersStock[]) => {
                    setLotContainersStock(newLotContainers);
                  }}
                  pId={selectedProduct.product_id || 0}
                  ppId={selectedProductPresentation?.product_presentation_id || 0}
                  unitLabel={selectedProductPresentation?.product_presentation_name ?? undefined}
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


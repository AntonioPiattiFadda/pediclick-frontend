import { adaptProductForDb } from "@/adapters/products";
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
import { DialogClose } from "@radix-ui/react-dialog";
import { Info, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import toast from 'react-hot-toast';
import { emptyLot } from "../../../../../components/admin/emptyFormData";
import { CreateProductPresentation, ProductPresentationSelectorRoot, SelectProductPresentation } from "../../../../../components/admin/selectors/productPresentationSelector";
import ProductSelector from "../../../../../components/admin/selectors/productSelector";
import { ProductEditSheet } from "../../../../../components/admin/stock/productEditSheet";
import { MoneyInput } from "../../../../../components/admin/ui/MoneyInput";
import ManageProductPrices from "../../../../../components/admin/pricesManagement.tsx/ManageProductPricesTabs";
import StockAssignationContainer from "./StockAssignationContainer";
import { calcFromBulk, calcFromUnit, calcFromTotal, ZERO_GROUP } from "./costCalculations";

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

  const [pendingConfirm, setPendingConfirm] = useState(false);

  useEffect(() => {
    if (!loading) {
      handleClose();
    }
  }, [loading]);


  const doSubmit = () => {
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

    if (!formData.initial_stock_quantity || formData.initial_stock_quantity <= 0) {
      toast('Debes ingresar la cantidad de stock nuevo');
      return;
    }

    const hasAssignedStock = stock.some(s => (s.quantity || 0) > 0);
    if (!hasAssignedStock) {
      setPendingConfirm(true);
      return;
    }

    doSubmit();
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setSelectedProduct(adaptProductForDb({} as Product));
    setFormData(emptyLot);
    setSelectedProductPresentation(null);
    setStock([]);
    setLotContainersStock([]);
    setPendingConfirm(false);

  };

  const handleUpdateLotField = (field: string, rawValue: number | string) => {
    const isNumericField = [
      "initial_stock_quantity",
      "extra_cost_total",
      "purchase_cost_per_bulk",
      "purchase_cost_per_unit",
      "purchase_cost_total",
      "download_cost_per_bulk",
      "download_cost_per_unit",
      "download_total_cost",
      "delivery_cost_per_bulk",
      "delivery_cost_per_unit",
      "delivery_cost_total",
      "productor_commission_percentage",
      "productor_commission_unit_value",
    ].includes(field);

    const value = isNumericField ? (Number(rawValue) || 0) : rawValue;
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const equiv = selectedProductPresentation?.bulk_quantity_equivalence ?? 0;

    const stock = field === "initial_stock_quantity"
      ? (value as number)
      : (formData.initial_stock_quantity ?? 0);

    let purchase = {
      per_bulk: formData.purchase_cost_per_bulk ?? 0,
      per_unit: formData.purchase_cost_per_unit ?? 0,
      total:    formData.purchase_cost_total    ?? 0,
    };
    let download = {
      per_bulk: formData.download_cost_per_bulk ?? 0,
      per_unit: formData.download_cost_per_unit ?? 0,
      total:    formData.download_total_cost    ?? 0,
    };
    let delivery = {
      per_bulk: formData.delivery_cost_per_bulk ?? 0,
      per_unit: formData.delivery_cost_per_unit ?? 0,
      total:    formData.delivery_cost_total    ?? 0,
    };
    let extraTotal = formData.extra_cost_total ?? 0;

    switch (field) {
      // ── Stock ───────────────────────────────────────────────────────
      case "initial_stock_quantity":
        setLotContainersStock(prev => prev.map(lcs => ({ ...lcs, quantity: 0 })));
        if ((value as number) === 0) {
          purchase = download = delivery = { ...ZERO_GROUP };
        } else {
          purchase = calcFromBulk(purchase.per_bulk, value as number, equiv);
          download = calcFromBulk(download.per_bulk, value as number, equiv);
          delivery = calcFromBulk(delivery.per_bulk, value as number, equiv);
        }
        break;

      // ── Compra ──────────────────────────────────────────────────────
      case "purchase_cost_per_bulk": purchase = calcFromBulk (value as number, stock, equiv); break;
      case "purchase_cost_per_unit": purchase = calcFromUnit (value as number, stock, equiv); break;
      case "purchase_cost_total":    purchase = calcFromTotal(value as number, stock, equiv); break;

      // ── Descarga ────────────────────────────────────────────────────
      case "download_cost_per_bulk": download = calcFromBulk (value as number, stock, equiv); break;
      case "download_cost_per_unit": download = calcFromUnit (value as number, stock, equiv); break;
      case "download_total_cost":    download = calcFromTotal(value as number, stock, equiv); break;

      // ── Envío ───────────────────────────────────────────────────────
      case "delivery_cost_per_bulk": delivery = calcFromBulk (value as number, stock, equiv); break;
      case "delivery_cost_per_unit": delivery = calcFromUnit (value as number, stock, equiv); break;
      case "delivery_cost_total":    delivery = calcFromTotal(value as number, stock, equiv); break;

      // ── Extra ───────────────────────────────────────────────────────
      case "extra_cost_total": extraTotal = value as number; break;

      // ── Campos string ───────────────────────────────────────────────
      case "productor_commission_type":
        setFormData(prev => ({
          ...prev,
          productor_commission_type: value as Lot["productor_commission_type"],
          productor_commission_percentage: null,
          productor_commission_unit_value: null,
        }));
        return;

      case "purchasing_agent_commision_type":
        setFormData(prev => ({
          ...prev,
          purchasing_agent_commision_type: value as Lot["purchasing_agent_commision_type"],
          purchasing_agent_commision_percentage: null,
          purchasing_agent_commision_unit_value: null,
        }));
        return;
    }

    const extraPerBulk = round2(extraTotal / (stock || 1));
    const extraPerUnit = round2(extraPerBulk / (equiv || 1));

    setFormData(prev => ({
      ...prev,
      initial_stock_quantity: stock,

      purchase_cost_per_bulk: purchase.per_bulk,
      purchase_cost_per_unit: purchase.per_unit,
      purchase_cost_total:    purchase.total,

      download_cost_per_bulk: download.per_bulk,
      download_cost_per_unit: download.per_unit,
      download_total_cost:    download.total,

      delivery_cost_per_bulk: delivery.per_bulk,
      delivery_cost_per_unit: delivery.per_unit,
      delivery_cost_total:    delivery.total,

      extra_cost_total:    round2(extraTotal),
      extra_cost_per_unit: extraPerUnit,

      final_cost_total:    equiv ? round2(purchase.total    + download.total    + delivery.total    + extraTotal)   : null,
      final_cost_per_bulk: equiv ? round2(purchase.per_bulk + download.per_bulk + delivery.per_bulk + extraPerBulk) : null,
      final_cost_per_unit: equiv ? round2(purchase.per_unit + download.per_unit + delivery.per_unit + extraPerUnit) : null,
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
        className={`border-4 ${isEditing ? "border-green-200" : "border-transparent"} flex flex-col gap-2 w-[90vw] max-w-[1400px] max-h-[90vh] min-h-[500px] overflow-hidden`}
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
          <div className="flex flex-col gap-1">
            <Label className="text-sm font-medium">Producto</Label>
            <ProductSelector
              value={selectedProduct}
              onChange={(value) => {
                setSelectedProduct({ ...selectedProduct, ...value })
                setStock([]);

              }

              }
            />
          </div>
        )}


        {isProductSelected ? (
          <>
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Presentación del producto</Label>
              <ProductPresentationSelectorRoot
                locationId={null}
                productId={selectedProduct.product_id!}
                value={selectedProductPresentation}
                onChange={(value) => {
                  setSelectedProductPresentation(value)
                  setStock([]);
                }}
              >
                <SelectProductPresentation />
                <CreateProductPresentation />
              </ProductPresentationSelectorRoot>
            </div>

            {/* Stock nuevo — prominent, full width */}
            <div className="rounded-lg border-2 border-blue-200 bg-blue-50 px-4 py-3 flex flex-col gap-1">
              <Label htmlFor="initial_stock_quantity" className="text-sm font-semibold text-blue-700">
                {selectedProductPresentation?.product_presentation_name
                  ? `Stock nuevo (en ${selectedProductPresentation.product_presentation_name})`
                  : "Stock nuevo"}
              </Label>
              <Input
                id="initial_stock_quantity"
                type="number"
                placeholder="--"
                className="text-lg h-11 font-medium bg-white"
                value={formData.initial_stock_quantity || undefined}
                onChange={(e) => handleUpdateLotField("initial_stock_quantity", Number(e.target.value))}
              />
              {selectedProductPresentation?.bulk_quantity_equivalence && formData.initial_stock_quantity ? (
                <p className="text-xs text-blue-600">
                  = {(formData.initial_stock_quantity || 0) * selectedProductPresentation.bulk_quantity_equivalence} unidades base
                </p>
              ) : null}
            </div>

            <div className="flex flex-row gap-4 flex-1 overflow-hidden min-h-0 relative">

              {/* Overlay: shown when product / presentation / stock not set */}
              {(() => {
                const msg = !selectedProduct.product_id
                  ? "Seleccioná un producto para continuar"
                  : !selectedProductPresentation?.product_presentation_id
                    ? "Seleccioná una presentación para modificar costos y precios"
                    : !formData.initial_stock_quantity
                      ? "Ingresá la cantidad de stock nuevo para continuar"
                      : null;
                return msg ? (
                  <div className="absolute inset-0 z-20 bg-background/75 backdrop-blur-[2px] flex items-center justify-center rounded-lg pointer-events-none">
                    <p className="text-muted-foreground text-sm font-medium px-4 text-center">{msg}</p>
                  </div>
                ) : null;
              })()}

              {/* LEFT: form */}
              <div className="flex flex-col gap-2 flex-1 min-w-0 overflow-y-auto pr-1">





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

                      {/* Header */}
                      <div className="grid grid-cols-[120px_1fr_1fr_1fr] gap-3 w-full mb-1 px-1">
                        <div />
                        <p className="text-xs font-medium text-muted-foreground text-center">Por bulto</p>
                        <p className="text-xs font-medium text-muted-foreground text-center">Por unidad / Kg</p>
                        <p className="text-xs font-medium text-muted-foreground text-center">Total</p>
                      </div>

                      {/* Compra */}
                      <div className="grid grid-cols-[120px_1fr_1fr_1fr] gap-3 w-full items-end">
                        <p className="text-sm font-medium pb-2 text-right pr-2">Compra</p>
                        <MoneyInput
                          value={formData.purchase_cost_per_bulk || undefined}
                          onChange={(v) => handleUpdateLotField("purchase_cost_per_bulk", Number(v))}
                        />
                        <MoneyInput
                          value={formData.purchase_cost_per_unit || undefined}
                          onChange={(v) => handleUpdateLotField("purchase_cost_per_unit", Number(v))}
                        />
                        <MoneyInput
                          value={formData.purchase_cost_total || undefined}
                          onChange={(v) => handleUpdateLotField("purchase_cost_total", Number(v))}
                        />
                      </div>

                      {/* Envío */}
                      <div className="grid grid-cols-[120px_1fr_1fr_1fr] gap-3 w-full items-end mt-2">
                        <p className="text-sm font-medium pb-2 text-right pr-2">Envío</p>
                        <MoneyInput
                          value={formData.delivery_cost_per_bulk || undefined}
                          onChange={(v) => handleUpdateLotField("delivery_cost_per_bulk", v ?? 0)}
                        />
                        <MoneyInput
                          value={formData.delivery_cost_per_unit || undefined}
                          onChange={(v) => handleUpdateLotField("delivery_cost_per_unit", v ?? 0)}
                        />
                        <MoneyInput
                          value={formData.delivery_cost_total || undefined}
                          onChange={(v) => handleUpdateLotField("delivery_cost_total", v ?? 0)}
                        />
                      </div>

                      {/* Descarga */}
                      <div className="grid grid-cols-[120px_1fr_1fr_1fr] gap-3 w-full items-end mt-2">
                        <p className="text-sm font-medium pb-2 text-right pr-2">Descarga</p>
                        <MoneyInput
                          value={formData.download_cost_per_bulk || undefined}
                          onChange={(v) => handleUpdateLotField("download_cost_per_bulk", v ?? 0)}
                        />
                        <MoneyInput
                          value={formData.download_cost_per_unit || undefined}
                          onChange={(v) => handleUpdateLotField("download_cost_per_unit", v ?? 0)}
                        />
                        <MoneyInput
                          value={formData.download_total_cost || undefined}
                          onChange={(v) => handleUpdateLotField("download_total_cost", v ?? 0)}
                        />
                      </div>

                      {/* Extra */}
                      <div className="grid grid-cols-[120px_1fr_1fr_1fr] gap-3 w-full items-end mt-2">
                        <p className="text-sm font-medium pb-2 text-right pr-2">Extra</p>
                        <div />
                        <div />
                        <MoneyInput
                          value={formData.extra_cost_total || undefined}
                          onChange={(v) => handleUpdateLotField("extra_cost_total", v ?? 0)}
                        />
                      </div>

                      {/* Final (calculado) */}
                      <div className="grid grid-cols-[120px_1fr_1fr_1fr] gap-3 w-full items-end mt-2 pt-2 border-t">
                        <p className="text-sm font-semibold pb-2 text-right pr-2">Total final</p>
                        <MoneyInput
                          disabled
                          value={formData.final_cost_per_bulk || undefined}
                          onChange={() => {}}
                        />
                        <MoneyInput
                          disabled
                          value={formData.final_cost_per_unit || undefined}
                          onChange={() => {}}
                        />
                        <MoneyInput
                          disabled
                          value={formData.final_cost_total || undefined}
                          onChange={() => {}}
                        />
                      </div>


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

              </div>

              {/* RIGHT: prices */}
              <div className="w-[520px] shrink-0 border-l pl-4 overflow-y-auto flex flex-col gap-2">
                <p className="text-sm font-medium">Precios</p>
                {selectedProductPresentation?.product_presentation_id ? (
                  <ManageProductPrices
                    key={selectedProductPresentation.product_presentation_id}
                    mode="inline"
                    productPresentationId={selectedProductPresentation.product_presentation_id}
                    finalCost={{
                      final_cost_total: formData?.final_cost_total || null,
                      final_cost_per_unit: formData?.final_cost_per_unit || null,
                      final_cost_per_bulk: formData?.final_cost_per_bulk || null,
                    }}
                    bulkQuantityEquivalence={selectedProductPresentation?.bulk_quantity_equivalence ?? null}
                    sellUnit={selectedProductPresentation?.sell_unit ?? null}
                    presentationName={selectedProductPresentation?.product_presentation_name ?? null}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground text-center py-8">
                    Seleccioná una presentación para gestionar precios
                  </div>
                )}
              </div>

            </div>
          </>
        ) : (
          <div className="w-full h-full text-center my-auto">
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
              {pendingConfirm && (
                <span className="mr-auto text-sm text-amber-600 font-medium">
                  ⚠️ El stock no fue asignado a ninguna ubicación. ¿Deseás continuar de todas formas?
                </span>
              )}

              <DialogClose asChild>
                <Button disabled={loading} variant={"outline"} onClick={() => {
                  setSelectedProduct({} as Product);
                  setFormData(emptyLot);
                  setIsEditing(false);
                }}>
                  Cancelar
                </Button>
              </DialogClose>

              {pendingConfirm ? (
                <>
                  <Button variant="outline" onClick={() => setPendingConfirm(false)}>
                    Volver
                  </Button>
                  <Button disabled={loading} variant="destructive" onClick={doSubmit}>
                    {loading ? "Agregando..." : "Continuar sin asignar"}
                  </Button>
                </>
              ) : (
                <Button disabled={loading} onClick={handleSubmit}>
                  {loading ? "Agregando..." : "Agregar"}
                </Button>
              )}
            </>
          )}

        </DialogFooter>
      </DialogContent >
    </Dialog >
  );
}


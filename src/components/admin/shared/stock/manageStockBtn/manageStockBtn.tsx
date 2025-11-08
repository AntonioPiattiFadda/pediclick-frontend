import {
  Accordion
} from "@/components/ui/accordion";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Lot } from "@/types/lots";
import type { Product } from "@/types/products";
import { useState } from "react";
import { ProductInfoAccordion } from "../ProductInfoDisplay";
import PricesAccordion from "../addStockBtn/pricesAccordion";
import StockLocationTable from "./StockLocationTable";


export function ManageStockBtn({
  product,

}: {
  product: Product;

}) {
  const [selectedProduct, setSelectedProduct] = useState<Product>(product);
  const [lots] = useState<Lot[]>(product?.lots || []);

  const lotsLength = product?.lots?.length || 0;
  const sortedLots = product?.lots?.slice().sort((a, b) => {
    if (a.lot_id && b.lot_id) {
      return a.lot_id - b.lot_id;
    }
    return 0;
  });

  const final_cost_total = sortedLots?.[lotsLength - 1]?.final_cost_total || null;
  const final_cost_per_unit = sortedLots?.[lotsLength - 1]?.final_cost_per_unit || null;
  const final_cost_per_bulk = sortedLots?.[lotsLength - 1]?.final_cost_per_bulk || null;

  console.log(final_cost_total, final_cost_per_unit, final_cost_per_bulk);

  console.log(sortedLots);
  // const [lotPrices, setLotPrices] = useState<Price[]>([]);
  const [tab, setTab] = useState("stock");

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

  // const handleUpdateLotField = (field: string, rawValue: number | string) => {
  //   // determinamos si el campo debe tratarse como numérico
  //   const isNumericField = [
  //     "initial_stock_quantity",
  //     "purchase_cost_per_unit",
  //     "purchase_cost_total",
  //     "download_total_cost",
  //     "download_cost_per_unit",
  //     "delivery_cost_total",
  //     "delivery_cost_per_bulk",
  //     "delivery_cost_per_unit",
  //     "productor_commission_percentage",
  //     "productor_commission_unit_value",
  //   ].includes(field);

  //   // si es numérico, convertimos; si no, dejamos el valor tal cual
  //   const value = isNumericField ? (Number(rawValue) || 0) : rawValue;

  //   // valores actuales (default 0 si son null/undefined)
  //   const currentInitialStock = formData.initial_stock_quantity ?? 0;


  //   const bulkQuantityEquivalence = formData.bulk_quantity_equivalence ?? 0;

  //   const currentTotalCost = formData.purchase_cost_total ?? 0;
  //   const currentCostPerUnit = formData.purchase_cost_per_unit ?? 0;
  //   const currentCostPerBulk = formData.purchase_cost_per_bulk ?? 0;

  //   const currentDownloadTotalCost = formData.download_total_cost ?? 0;
  //   const currentDownloadCostPerUnit = formData.download_cost_per_unit ?? 0;
  //   const currentDownloadCostPerBulk = formData.download_cost_per_bulk ?? 0;


  //   const currentDeliveryCostTotal = formData.delivery_cost_total ?? 0;
  //   const currentDeliveryCostPerBulk = formData.delivery_cost_per_bulk ?? 0;
  //   const currentDeliveryCostPerUnit = formData.delivery_cost_per_unit ?? 0;



  //   let newInitialStock = currentInitialStock;

  //   let newTotalCost = currentTotalCost;
  //   let newCostPerUnit = currentCostPerUnit;
  //   let newCostPerBulk = currentCostPerBulk;

  //   let newDownloadTotalCost = currentDownloadTotalCost;
  //   let newDownloadCostPerUnit = currentDownloadCostPerUnit;
  //   let newDownloadCostPerBulk = currentDownloadCostPerBulk;

  //   let newDeliveryCostTotal = currentDeliveryCostTotal;
  //   let newDeliveryCostPerBulk = currentDeliveryCostPerBulk;
  //   let newDeliveryCostPerUnit = currentDeliveryCostPerUnit;

  //   const validStock =
  //     currentInitialStock !== null && currentInitialStock > 0;
  //   const validBulkEquiv =
  //     bulkQuantityEquivalence !== null && bulkQuantityEquivalence > 0;

  //   switch (field) {
  //     case "initial_stock_quantity":
  //       newInitialStock = value as number;

  //       // if (newInitialStock <= 0) {
  //       //   // si borra el stock → todo a 0
  //       //   newTotalCost = 0;
  //       //   newCostPerUnit = 0;
  //       //   newDownloadTotalCost = 0;
  //       //   newDownloadCostPerUnit = 0;
  //       // } else {
  //       //   // --- Compra ---
  //       //   if (currentCostPerUnit > 0) {
  //       //     newTotalCost = newInitialStock * currentCostPerUnit;
  //       //   } else if (currentTotalCost > 0) {
  //       //     newCostPerUnit = currentTotalCost / newInitialStock;
  //       //   }

  //       //   // --- Descarga ---
  //       //   if (currentDownloadCostPerUnit > 0) {
  //       //     newDownloadTotalCost = newInitialStock * currentDownloadCostPerUnit;
  //       //   } else if (currentDownloadTotalCost > 0) {
  //       //     newDownloadCostPerUnit = currentDownloadTotalCost / newInitialStock;
  //       //   }
  //       // }
  //       break;

  //     case "purchase_cost_per_unit": {
  //       newCostPerUnit = value as number;

  //       if (!validStock || !validBulkEquiv || !value || value as number <= 0) break;

  //       newCostPerBulk = value as number * bulkQuantityEquivalence;
  //       newTotalCost = newCostPerBulk * currentInitialStock;
  //       break;
  //     }
  //     case "purchase_cost_per_bulk": {
  //       newCostPerBulk = value as number;
  //       if (!validStock || !validBulkEquiv || !value || value as number <= 0) break;

  //       newCostPerUnit = value as number / bulkQuantityEquivalence;
  //       newTotalCost = value as number * currentInitialStock;
  //       break;
  //     }
  //     case "purchase_cost_total": {
  //       newTotalCost = value as number;
  //       if (!validStock || !validBulkEquiv || !value || value as number <= 0) break;

  //       newCostPerBulk = value as number / currentInitialStock;
  //       newCostPerUnit = newCostPerBulk / bulkQuantityEquivalence;
  //       break;
  //     }
  //       newTotalCost = value as number;

  //       if (newTotalCost <= 0) {
  //         // si borra costo total → costo unitario a 0
  //         newCostPerUnit = 0;
  //       } else if (currentInitialStock > 0) {
  //         newCostPerUnit = newTotalCost / currentInitialStock;
  //       }
  //       break;

  //     case "download_cost_per_unit": {
  //       newDownloadCostPerUnit = value as number;
  //       if (!validStock || !validBulkEquiv || !value || value as number <= 0) break;

  //       newDownloadCostPerBulk = value as number * bulkQuantityEquivalence;
  //       newDownloadTotalCost = newDownloadCostPerBulk * currentInitialStock;
  //       break;
  //     }

  //     case "download_cost_per_bulk": {
  //       newDownloadCostPerBulk = value as number;
  //       if (!validStock || !validBulkEquiv || !value || value as number <= 0) break;

  //       newDownloadCostPerUnit = value as number / bulkQuantityEquivalence;
  //       newDownloadTotalCost = value as number * currentInitialStock;
  //       break;
  //     }
  //     case "download_total_cost": {
  //       newDownloadTotalCost = value as number;
  //       if (!validStock || !validBulkEquiv || !value || value as number <= 0) break;
  //       console.log({ currentInitialStock });
  //       console.log({ value });
  //       newDownloadCostPerBulk = value as number / currentInitialStock;
  //       newDownloadCostPerUnit = newDownloadCostPerBulk / bulkQuantityEquivalence;

  //       console.log({ newDownloadCostPerBulk, newDownloadCostPerUnit });
  //       break;
  //     }
  //     case "productor_commission_type":
  //       // este campo es string, no numérico
  //       setFormData(prev => ({
  //         ...prev,
  //         productor_commission_type: value as Lot["productor_commission_type"],
  //         productor_commission_percentage: null,
  //         productor_commission_unit_value: null,
  //       }));
  //       return; // salimos para no aplicar los cálculos numéricos

  //     case "delivery_cost_per_unit": {
  //       newDeliveryCostPerUnit = value as number;
  //       if (!validStock || !validBulkEquiv || !value || value as number <= 0) break;

  //       newDeliveryCostPerBulk = value as number * bulkQuantityEquivalence;
  //       newDeliveryCostTotal = newDeliveryCostPerBulk * currentInitialStock;
  //       break;
  //     }

  //     case "delivery_cost_per_bulk": {
  //       newDeliveryCostPerBulk = value as number;
  //       if (!validStock || !validBulkEquiv || !value || value as number <= 0) break;

  //       newDeliveryCostPerUnit = value as number / bulkQuantityEquivalence;
  //       newDeliveryCostTotal = value as number * currentInitialStock;
  //       break;
  //     }

  //     case "delivery_cost_total": {
  //       newDeliveryCostTotal = value as number;
  //       if (!validStock || !validBulkEquiv || !value || value as number <= 0) break;

  //       newDeliveryCostPerBulk = value as number / currentInitialStock;
  //       newDeliveryCostPerUnit = newDeliveryCostPerBulk / bulkQuantityEquivalence;
  //       break;
  //     }


  //     case "purchasing_agent_commision_type":
  //       // este campo es string, no numérico
  //       setFormData(prev => ({
  //         ...prev,
  //         purchasing_agent_commision_type: value as Lot["purchasing_agent_commision_type"],
  //         purchasing_agent_commision_percentage: null,
  //         purchasing_agent_commision_unit_value: null,
  //       }));
  //       return; // salimos para no aplicar los cálculos numéricos

  //   }

  //   // actualizamos el formData con los nuevos valores calculados
  //   setFormData(prev => ({
  //     ...prev,
  //     initial_stock_quantity: newInitialStock,


  //     purchase_cost_total: newTotalCost,
  //     purchase_cost_per_unit: newCostPerUnit,
  //     purchase_cost_per_bulk: newCostPerBulk,


  //     download_total_cost: newDownloadTotalCost,
  //     download_cost_per_bulk: newDownloadCostPerBulk,
  //     download_cost_per_unit: newDownloadCostPerUnit,

  //     delivery_cost_total: newDeliveryCostTotal,
  //     delivery_cost_per_bulk: newDeliveryCostPerBulk,
  //     delivery_cost_per_unit: newDeliveryCostPerUnit,
  //   }));
  // };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {`Manejar stock a Producto: ${selectedProduct?.product_name}`}
        </DialogTitle>
        {/* <DialogDescription>
            Completá la información del nuevo elemento que querés publicar.
          </DialogDescription> */}
      </DialogHeader>


      <Accordion type="multiple" className="w-full">
        <ProductInfoAccordion
          product={selectedProduct}
          onChangeSelectedProduct={(updated) => setSelectedProduct(updated)}
        />

        <PricesAccordion
          productId={selectedProduct.product_id!}
          finalCost={{
            final_cost_total: final_cost_total,
            final_cost_per_unit: final_cost_per_unit,
            final_cost_per_bulk: final_cost_per_bulk,
          }}
        />



      </Accordion>



      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full">
          {/* <TabsTrigger value="product">Producto</TabsTrigger>
              <TabsTrigger value="prices">Precios</TabsTrigger> */}
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="transformation">Transformación</TabsTrigger>
        </TabsList>
        {tab === "product" && (
          <div className="mt-2">
            {/* <ProductEditSheet
                    product={selectedProduct}
                    onUpdated={(updated) => setSelectedProduct(updated)}
                  /> */}
          </div>
        )}
        <TabsContent value="stock" className="mt-4">
          <StockLocationTable lots={lots} />
        </TabsContent>

        <TabsContent value="transformation" className="mt-4">Transformation</TabsContent>


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
      </Tabs >



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
    </>
  );
}

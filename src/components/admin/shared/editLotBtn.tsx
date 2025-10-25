// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Textarea } from "@/components/ui/textarea";
// import type { Lot } from "@/types/lots";
// import type { Price } from "@/types/prices";
// import type { Product } from "@/types/products";
// import { Edit } from "lucide-react";
// import { useEffect, useState } from "react";
// import { LotContainerSelector } from "../addLoadOrder/lotContainerSelector";
// import { BrandSelectorRoot, SelectBrand } from "./brandSelector";
// import { CategorySelectorRoot, SelectCategory } from "./categorySelector";
// import { ProductEditSheet } from "./productEditSheet";
// import { SelectSubCategory, SubCategorySelectorRoot } from "./subCategorySelector";

// export function EditLotBtn({
//   lot,
//   onUpdateLot,
// }: {
//   lot: Lot;
//   onUpdateLot: (updatedLot: Lot) => void;
// }) {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [formData, setFormData] = useState<Lot>(lot);
//   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
//   const [lotPrices, setLotPrices] = useState<Price[]>([]);
//   const [tab, setTab] = useState("lot");

//   // sincroniza datos iniciales cuando abre el modal
//   useEffect(() => {
//     if (isModalOpen) {
//       setFormData(lot);
//       setLotPrices(lot.prices || []);
//       setSelectedProduct({
//         product_id: lot.product_id!,
//         product_name: lot.product_name!,
//         category_id: lot.category_id ?? null,
//         sub_category_id: lot.sub_category_id ?? null,
//         brand_id: lot.brand_id ?? null,
//         barcode: lot.barcode ?? null,
//         short_code: lot.short_code ?? null,
//         observations: lot.observations ?? "",
//         public_image_src: lot.public_image_src ?? "",
//       } as Product);
//     }
//   }, [isModalOpen, lot]);

//   const handleClose = () => {
//     setIsModalOpen(false);
//     setFormData(lot);
//   };

//   type LotField =
//     | "initial_stock_quantity"
//     | "purchase_cost_per_unit"
//     | "purchase_cost_total"
//     | "download_total_cost"
//     | "download_cost_per_unit";

//   const handleUpdateLotField = (field: LotField, rawValue: number | string) => {
//     const value = Number(rawValue) || 0;

//     const currentTotalCost = formData.purchase_cost_total ?? 0;
//     const currentInitialStock = formData.initial_stock_quantity ?? 0;
//     const currentCostPerUnit = formData.purchase_cost_per_unit ?? 0;
//     const currentDownloadTotalCost = formData.download_total_cost ?? 0;
//     const currentDownloadCostPerUnit = formData.download_cost_per_unit ?? 0;

//     let newTotalCost = currentTotalCost;
//     let newInitialStock = currentInitialStock;
//     let newCostPerUnit = currentCostPerUnit;
//     let newDownloadTotalCost = currentDownloadTotalCost;
//     let newDownloadCostPerUnit = currentDownloadCostPerUnit;

//     switch (field) {
//       case "initial_stock_quantity":
//         newInitialStock = value;
//         if (value <= 0) {
//           newTotalCost = 0;
//           newCostPerUnit = 0;
//           newDownloadTotalCost = 0;
//           newDownloadCostPerUnit = 0;
//         } else {
//           if (currentCostPerUnit > 0) newTotalCost = value * currentCostPerUnit;
//           else if (currentTotalCost > 0)
//             newCostPerUnit = currentTotalCost / value;
//           if (currentDownloadCostPerUnit > 0)
//             newDownloadTotalCost = value * currentDownloadCostPerUnit;
//           else if (currentDownloadTotalCost > 0)
//             newDownloadCostPerUnit = currentDownloadTotalCost / value;
//         }
//         break;
//       case "purchase_cost_per_unit":
//         newCostPerUnit = value;
//         newTotalCost = currentInitialStock > 0 ? value * currentInitialStock : 0;
//         break;
//       case "purchase_cost_total":
//         newTotalCost = value;
//         newCostPerUnit =
//           currentInitialStock > 0 ? value / currentInitialStock : 0;
//         break;
//       case "download_total_cost":
//         newDownloadTotalCost = value;
//         newDownloadCostPerUnit =
//           currentInitialStock > 0 ? value / currentInitialStock : 0;
//         break;
//       case "download_cost_per_unit":
//         newDownloadCostPerUnit = value;
//         newDownloadTotalCost =
//           currentInitialStock > 0 ? value * currentInitialStock : 0;
//         break;
//     }

//     setFormData({
//       ...formData,
//       purchase_cost_total: newTotalCost,
//       initial_stock_quantity: newInitialStock,
//       purchase_cost_per_unit: newCostPerUnit,
//       download_total_cost: newDownloadTotalCost,
//       download_cost_per_unit: newDownloadCostPerUnit,
//     });
//   };

//   const handleSubmit = () => {
//     onUpdateLot({
//       ...formData,
//       product_id: selectedProduct?.product_id,
//       product_name: selectedProduct?.product_name ?? "",
//       prices: lotPrices,
//     });
//     handleClose();
//   };

//   return (
//     <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
//       <DialogTrigger asChild>
//         <Button variant="outline">
//           <Edit className="mr-2 h-4 w-4" />
//         </Button>
//       </DialogTrigger>
//       <DialogContent className="flex flex-col gap-2 w-[750px] overflow-y-auto max-h-[90vh] min-h-[500px]">
//         <DialogHeader>
//           <DialogTitle>
//             {formData ? `Editando lote #${formData.lot_number}` : "Cargando..."}
//           </DialogTitle>
//         </DialogHeader>

//         {formData && selectedProduct ? (
//           <Tabs value={tab} onValueChange={setTab} className="w-full">
//             <TabsList className="grid grid-cols-2 w-full">
//               <TabsTrigger value="lot">Lote</TabsTrigger>
//               <TabsTrigger value="product">Producto</TabsTrigger>
//             </TabsList>

//             {/* --- TAB LOTE --- */}
//             <TabsContent value="lot" className="flex flex-col gap-2 mt-2">
//               <div className="grid grid-cols-2 gap-4 w-full">
//                 <div className="flex flex-col gap-2">
//                   <Label>Nro de Lote</Label>
//                   <Input
//                     type="number"
//                     value={formData.lot_number ?? ""}
//                     onChange={(e) =>
//                       setFormData({
//                         ...formData,
//                         lot_number: Number(e.target.value),
//                       })
//                     }
//                   />
//                 </div>
//                 <div className="flex flex-col gap-2">
//                   <Label>Stock inicial</Label>
//                   <Input
//                     type="number"
//                     value={formData.initial_stock_quantity ?? ""}
//                     onChange={(e) =>
//                       handleUpdateLotField(
//                         "initial_stock_quantity",
//                         Number(e.target.value)
//                       )
//                     }
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-3 gap-4 w-full">
//                 <div className="flex flex-col gap-2">
//                   <Label>Costo total</Label>
//                   <Input
//                     type="number"
//                     value={formData.purchase_cost_total ?? ""}
//                     onChange={(e) =>
//                       handleUpdateLotField(
//                         "purchase_cost_total",
//                         Number(e.target.value)
//                       )
//                     }
//                   />
//                 </div>
//                 <div className="flex flex-col gap-2">
//                   <Label>Costo unitario</Label>
//                   <Input
//                     type="number"
//                     value={formData.purchase_cost_per_unit ?? ""}
//                     onChange={(e) =>
//                       handleUpdateLotField(
//                         "purchase_cost_per_unit",
//                         Number(e.target.value)
//                       )
//                     }
//                   />
//                 </div>
//                 <div className="flex flex-col gap-2">
//                   <Label>Costo descarga/unidad</Label>
//                   <Input
//                     type="number"
//                     value={formData.download_cost_per_unit ?? ""}
//                     onChange={(e) =>
//                       handleUpdateLotField(
//                         "download_cost_per_unit",
//                         Number(e.target.value)
//                       )
//                     }
//                   />
//                 </div>
//               </div>

//               <div className="flex flex-col gap-2">
//                 <Label>Fecha de vencimiento</Label>
//                 <Input
//                   type="date"
//                   value={formData.expiration_date ?? ""}
//                   onChange={(e) =>
//                     setFormData({
//                       ...formData,
//                       expiration_date: e.target.value,
//                     })
//                   }
//                 />
//               </div>

//               <div className="flex flex-col gap-2">
//                 <Label>Vacíos</Label>
//                 <LotContainerSelector
//                   disabled={false}
//                   assignments={formData.lot_containers ?? []}
//                   initialQuantity={formData.initial_stock_quantity || 0}
//                   onChange={(next) =>
//                     setFormData({
//                       ...formData,
//                       lot_containers: next,
//                       has_lot_container: (next ?? []).some(
//                         (a) => (Number(a?.quantity) || 0) > 0
//                       ),
//                     })
//                   }
//                 />
//               </div>
//             </TabsContent>

//             {/* --- TAB PRODUCTO --- */}
//             <TabsContent value="product" className="mt-2">
//               <ProductEditSheet
//                 product={selectedProduct}
//                 onUpdated={(updated) => setSelectedProduct(updated)}
//               />

//               <div className="grid grid-cols-2 gap-4 mt-2">
//                 <div className="flex flex-col gap-2">
//                   <Label>Código de barras</Label>
//                   <Input
//                     type="number"
//                     value={selectedProduct.barcode ?? ""}
//                     onChange={(e) =>
//                       setSelectedProduct({
//                         ...selectedProduct,
//                         barcode: Number(e.target.value),
//                       })
//                     }
//                   />
//                 </div>

//                 <div className="flex flex-col gap-2">
//                   <Label>Categoría</Label>
//                   <CategorySelectorRoot
//                     value={selectedProduct.category_id}
//                     onChange={(id) =>
//                       setSelectedProduct({
//                         ...selectedProduct,
//                         category_id: id,
//                       })
//                     }
//                   >
//                     <SelectCategory />
//                   </CategorySelectorRoot>
//                 </div>

//                 <div className="flex flex-col gap-2">
//                   <Label>Subcategoría</Label>
//                   <SubCategorySelectorRoot
//                     value={selectedProduct.sub_category_id?.toString() ?? ""}
//                     onChange={(id) =>
//                       setSelectedProduct({
//                         ...selectedProduct,
//                         sub_category_id: id ? Number(id) : null,
//                       })
//                     }
//                   >
//                     <SelectSubCategory />
//                   </SubCategorySelectorRoot>
//                 </div>

//                 <div className="flex flex-col gap-2">
//                   <Label>Marca</Label>
//                   <BrandSelectorRoot
//                     value={selectedProduct.brand_id?.toString() ?? ""}
//                     onChange={(id) =>
//                       setSelectedProduct({
//                         ...selectedProduct,
//                         brand_id: id ? Number(id) : null,
//                       })
//                     }
//                   >
//                     <SelectBrand />
//                   </BrandSelectorRoot>
//                 </div>

//                 <div className="flex flex-col gap-2 col-span-2">
//                   <Label>Observaciones</Label>
//                   <Textarea
//                     value={selectedProduct.observations ?? ""}
//                     onChange={(e) =>
//                       setSelectedProduct({
//                         ...selectedProduct,
//                         observations: e.target.value,
//                       })
//                     }
//                   />
//                 </div>
//               </div>
//             </TabsContent>
//           </Tabs>
//         ) : (
//           <div className="text-center my-auto">Sin datos de lote.</div>
//         )}

//         <DialogFooter className="mt-auto sticky bottom-0 bg-white py-4">
//           <Button variant="outline" onClick={handleClose}>
//             Cancelar
//           </Button>
//           <Button onClick={handleSubmit}>Aceptar</Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }

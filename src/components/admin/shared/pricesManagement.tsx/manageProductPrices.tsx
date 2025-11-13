// import { pricesAdapter } from "@/adapters/prices";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Textarea } from "@/components/ui/textarea";
// import { createPrices } from "@/service/prices";
// import type { Price, PriceLogicType, PriceType } from "@/types/prices";
// import type { Store } from "@/types/stores";
// import { useMutation } from "@tanstack/react-query";
// import { DollarSign, Percent, Plus, Trash2, X } from "lucide-react";
// import { useEffect, useState } from "react";
// import { toast } from 'react-hot-toast';
// import CostBadges from "./CostBadges";
// interface PricesDialogProps {
//     productId: number;
//     disabled?: boolean;
//     finalCost: {
//         final_cost_total: number | null;
//         final_cost_per_unit: number | null;
//         final_cost_per_bulk: number | null;
//     };
//     productPrices: Price[];
//     stores: Store[];
//     selectedStoreId: number | null;
//     onSelectStore: (storeId: number | null) => void;


//     // lotId: number;
//     // lotNumber: number;
//     // stockId: number;
//     // loadOrderId: number;
//     // // value: Price[];
//     // // onChange: (prices: Price[]) => void;
//     // cost_per_unit: number; // costo unitario base
//     // storeId: number | null;
//     // hasCost?: boolean;
// }

// export default function ManageProductPrices({
//     productId,
//     disabled = false,
//     finalCost,
//     productPrices,
//     stores,
//     selectedStoreId,
//     onSelectStore,


//     // lotId,
//     // stockId,
//     // lotNumber,
//     // loadOrderId,
//     // // value,
//     // // onChange,
//     // cost_per_unit,
//     // storeId,
//     // hasCost
// }: PricesDialogProps) {

//     const lotId = 1;
//     const storeId = 1;
//     // const queryClient = useQueryClient();


//     console.log(finalCost)
//     console.log("stores:", stores);
//     console.log("productPrices:", productPrices);



//     const [value, onChange] = useState<Price[]>(productPrices);
//     console.log("value state:", value);
//     const [pricesToDelete, setPricesToDelete] = useState<number[]>([]);

//     console.log("value:", value);

//     const createPricesMutation = useMutation({
//         mutationFn: async (adaptedPrices: Price[]) => {
//             return await createPrices(adaptedPrices, pricesToDelete);
//         },
//         onSuccess: () => {
//             // queryClient.invalidateQueries({ queryKey: ["load-order", Number(loadOrderId)], });
//         },
//         onError: (error: {
//             message: string;
//         }) => {
//             const errorMessage = error.message;
//             toast.error(errorMessage || "Error al crear precios")
//         },
//     });

//     const [showObservations, setShowObservations] = useState<Record<string, boolean>>({});

//     useEffect(() => {
//         // Inicializar: true si ya tiene observaciones, false si no
//         const initState: Record<string, boolean> = {};
//         productPrices.forEach((p, idx) => {
//             const key = String(p.price_id ?? `new-${idx}`);
//             initState[key] = !!p.observations;
//         });
//         setShowObservations(initState);
//     }, [productPrices]);


//     // Helpers
//     const round2 = (n: number) => Math.round(n * 100) / 100;
//     const ensureUnits = (u?: number) => (u && u > 0 ? u : 1);

//     // === Recalc logic ===
//     function recalcFromPercentage(row: Price, price_type: PriceType): Price {
//         if (!finalCost?.final_cost_per_unit || !finalCost?.final_cost_per_bulk) return row;
//         const units = ensureUnits(row.qty_per_price);
//         const pct = row.profit_percentage ?? 0;
//         const perUnit = price_type === "MINOR" ? finalCost?.final_cost_per_unit * (1 + pct / 100) : finalCost?.final_cost_per_bulk * (1 + pct / 100);
//         const price = round2(perUnit * units);
//         return { ...row, qty_per_price: units, price };
//     }

//     function recalcFromPrice(row: Price, price_type: PriceType): Price {

//         if (!finalCost?.final_cost_per_unit || !finalCost?.final_cost_per_bulk) return row;
//         // const units = row.qty_per_price;
//         const profit_percentage = price_type === "MINOR" ?
//             row.price * 100 / (finalCost?.final_cost_per_unit * row.qty_per_price) - 100
//             :
//             row.price * 100 / (finalCost?.final_cost_per_bulk * row.qty_per_price) - 100
//             ;

//         return { ...row, profit_percentage };
//     }

//     // function recalcFromUnits(row: Price, prevUnits?: number, price_type: PriceType): Price {
//     //     const units = ensureUnits(row.qty_per_price);

//     //     if (Number.isFinite(row.profit_percentage)) {
//     //         const pct = row.profit_percentage ?? 0;
//     //         const perUnit = price_type === "MINOR" ? finalCost?.final_cost_per_unit * (1 + pct / 100) : finalCost?.final_cost_per_bulk * (1 + pct / 100);
//     //         const price = round2(perUnit * units);
//     //         return { ...row, qty_per_price: units, price };
//     //     }

//     //     const oldUnits = ensureUnits(prevUnits);
//     //     const prevPerUnit = row.price / oldUnits;
//     //     const price = round2(prevPerUnit * units);
//     //     const profit_percentage = round2((prevPerUnit / finalCost.final_cost_per_unit - 1) * 100);

//     //     console.log({ ...row, qty_per_price: units, price, profit_percentage });

//     //     return { ...row, qty_per_price: units, price, profit_percentage };
//     // }

//     type UpdateField = "profit_percentage" | "price" | "qty_per_price" | 'observations' | 'valid_until';

//     function updatePriceField(
//         prices: Price[],
//         priceId: number,
//         field: UpdateField,
//         value: string | number,
//         price_type: PriceType
//     ): Price[] {
//         return prices.map((row) => {
//             if (row.price_id !== priceId) return row;
//             // const prevUnits = row.qty_per_price;
//             let next: Price = { ...row };

//             const toNumber = (v: string | number) =>
//                 typeof v === "number" ? v : parseFloat(v.replace(",", "."));

//             if (field === "profit_percentage") {
//                 const pct = toNumber(value);
//                 next.profit_percentage = Number.isFinite(pct) ? pct : 0;
//                 next = recalcFromPercentage(next, price_type);
//             }
//             if (field === "price") {
//                 const up = toNumber(value);
//                 next.price = Number.isFinite(up) ? up : 0;
//                 next = recalcFromPrice(next, price_type);
//             }
//             if (field === "qty_per_price") {
//                 const units = toNumber(value);
//                 next.qty_per_price = Number.isFinite(units) ? Math.max(1, units) : 1;

//                 // next = recalcFromUnits(next, prevUnits, price_type);
//             }

//             if (field === 'observations') {
//                 next.observations = String(value);
//             }

//             if (field === 'valid_until') {
//                 next.valid_until = String(value);
//             }

//             return next;
//         });
//     }


//     // === Render category ===
//     function renderCategory(prices: Price[], price_type: "MINOR" | "MAYOR", logic_type: PriceLogicType) {
//         const filtered = prices
//             .filter((p) => p.price_type === price_type && p.logic_type === logic_type)
//             .sort((a, b) => a.price_number - b.price_number);
//         const isLimitedOffer = logic_type === "LIMITED_OFFER";
//         return (
//             <div className="space-y-2">
//                 {filtered.map((price, index) => {
//                     const key = String(price.price_id ?? `new-${index}`);
//                     const isVisible = showObservations[key] ?? false;
//                     return <div key={index} className="flex flex-col gap-1">
//                         <div

//                             className="grid grid-cols-[1fr_1fr_1fr_40px] gap-2 items-center"
//                         >
//                             {finalCost?.final_cost_total && (
//                                 <div className="relative">
//                                     <Percent className="absolute w-3 h-3 left-2 top-1/2 -translate-y-1/2 opacity-50" />
//                                     <Input
//                                         placeholder="Ganancia %"
//                                         className="pl-5"
//                                         value={price.profit_percentage}
//                                         disabled={disabled}
//                                         onChange={(e) =>
//                                             onChange(updatePriceField(value, price.price_id!, "profit_percentage", e.target.value, price_type))
//                                         }
//                                     />
//                                 </div>
//                             )}
//                             <div className="relative">
//                                 <DollarSign className="absolute w-3 h-3 left-2 top-1/2 -translate-y-1/2 opacity-50" />
//                                 <Input
//                                     placeholder="Precio total"
//                                     className="pl-5"
//                                     value={price.price}
//                                     disabled={disabled}
//                                     onChange={(e) =>
//                                         onChange(updatePriceField(value, price.price_id!, "price", e.target.value, price_type))
//                                     }
//                                 />
//                             </div>

//                             <Input
//                                 placeholder="Unidades"
//                                 value={price.qty_per_price}
//                                 disabled={disabled}
//                                 onChange={(e) =>
//                                     onChange(updatePriceField(value, price.price_id!, "qty_per_price", e.target.value, price_type))
//                                 }
//                             />
//                             <Button
//                                 variant="ghost"
//                                 size="icon"
//                                 disabled={disabled}
//                                 onClick={() => {
//                                     onChange(value.filter((p) => p.price_id !== price.price_id))
//                                     if (price.price_id && !price.isNew) {
//                                         setPricesToDelete((prev) => [...prev, price.price_id!]);
//                                     }
//                                 }}
//                             >
//                                 <Trash2 className="w-4 h-4 text-red-500" />
//                             </Button>
//                         </div>
//                         {isVisible ? (
//                             <div className="relative">
//                                 <Textarea
//                                     placeholder="Observaciones"
//                                     value={price.observations ?? ""}
//                                     disabled={disabled}
//                                     onChange={(e) =>
//                                         onChange(updatePriceField(value, price.price_id!, "observations", e.target.value, price_type))
//                                     }

//                                 />
//                                 <button
//                                     className="absolute top-1 right-1 "
//                                     onClick={() => {
//                                         setShowObservations((prev) => ({
//                                             ...prev,
//                                             [key]: false,
//                                         }))
//                                         onChange(updatePriceField(value, price.price_id!, "observations", "", price_type))
//                                     }}><X className="w-4 h-4 cursor-pointer" /></button>
//                             </div>
//                         ) : (
//                             <Button
//                                 className={`${logic_type === "QUANTITY_DISCOUNT" ? "hidden" : ""}`}
//                                 type="button"
//                                 variant="outline"
//                                 size="sm"
//                                 disabled={disabled}
//                                 onClick={() =>
//                                     setShowObservations((prev) => ({
//                                         ...prev,
//                                         [key]: true,
//                                     }))
//                                 }
//                             >
//                                 + Agregar observación
//                             </Button>
//                         )}

//                         {isLimitedOffer && (
//                             <div className="flex gap-2">
//                                 <label>Válido hasta</label>
//                                 <input
//                                     type="date"
//                                     value={price.valid_until ? price.valid_until.split('T')[0] : ''}
//                                     onChange={(e) =>
//                                         onChange(updatePriceField(value, price.price_id!, "valid_until", e.target.value, price_type))
//                                     }
//                                     className="border border-gray-300 rounded px-2 py-1"
//                                 />

//                             </div>
//                         )}
//                     </div>
//                 })}
//                 <Button
//                     variant="outline"
//                     disabled={disabled}
//                     onClick={() => {
//                         const newPrice: Price = {
//                             price_id: Math.random(), // Temporal, se reemplaza al guardar
//                             isNew: true,
//                             product_id: productId,
//                             store_id: storeId,
//                             price_number: value.length + 1,
//                             price: 0,
//                             qty_per_price: 1,
//                             profit_percentage: 0,
//                             price_type,
//                             logic_type,
//                             observations: null,
//                             is_limited_offer: logic_type === "LIMITED_OFFER",
//                             is_active: true,
//                             valid_from: null,
//                             valid_until: null,
//                         };
//                         onChange([...value, newPrice]);
//                     }}
//                 >
//                     <Plus className="w-4 h-4" /> Agregar precio
//                 </Button>
//             </div>
//         );
//     }

//     const handleCreatePrices = async () => {
//         // TODO Validar los precios aca
//         const adaptedPrices = pricesAdapter(value, lotId);
//         createPricesMutation.mutate(adaptedPrices);
//     }

//     // const handleCancel = () => {
//     //     onChange(productPrices); // Reset to original prices on cancel
//     // }



//     return (
//         <Card className="p-0 border-none shadow-none">

//             < CardContent className="p-0 border-none" >
//                 <CardHeader className="p-0 flex flex-row justify-between mb-2" >
//                     <CardTitle>Costos:</CardTitle>
//                     <CostBadges finalCost={finalCost} />
//                 </CardHeader >


//                 <Tabs defaultValue="MINOR" className="w-full">
//                     <TabsList className="grid grid-cols-2 w-full mb-4">
//                         <TabsTrigger value="MINOR">Minorista</TabsTrigger>
//                         <TabsTrigger value="MAYOR">Mayorista</TabsTrigger>
//                     </TabsList>



//                     <RadioGroup
//                         defaultValue="all"
//                         className="flex gap-4"
//                         value={selectedStoreId ? selectedStoreId.toString() : "all"}
//                         onValueChange={
//                             (value) => {
//                                 if (value === "all") {
//                                     onSelectStore(null);
//                                 } else {
//                                     onSelectStore(Number(value));
//                                 }
//                             }
//                         }
//                     >
//                         <div className="flex items-center space-x-2">
//                             <RadioGroupItem value="all" id="all" />
//                             <Label htmlFor="all">Universal (todas las tiendas)</Label>
//                         </div>
//                         {stores.map((store) => (
//                             <div key={store.store_id} className="flex items-center space-x-2">
//                                 <RadioGroupItem value={store.store_id.toString()} id={`store-${store.store_id}`} />
//                                 <Label htmlFor={`store-${store.store_id}`}>Solo {store.store_name}</Label>
//                             </div>
//                         ))}
//                     </RadioGroup>
//                     <Badge variant="secondary" className="text-xs">
//                         Los precios marcados como “universales” se aplican a todas las tiendas.
//                         Si elegís una tienda específica, el precio solo afectará a esa tienda.
//                     </Badge>

//                     {/* --- Minorista --- */}
//                     <TabsContent value="MINOR">
//                         <div className="grid grid-cols-3 gap-4">
//                             <div>
//                                 <div className="flex items-center justify-between">
//                                     <h3 className="font-semibold mb-2">Por cantidad</h3>
//                                     {/* <GetPreviousPrices
//                                         onClick={(previousPrice) => {
//                                             if (previousPrice?.length === 0) {
//                                                 toast.error("No se encontró un precio anterior para este producto.");
//                                                 return
//                                                 };
//                                                 const otherPrices = value.filter(p => p.price_type !== "MINOR" || p.logic_type !== "QUANTITY_DISCOUNT");
//                                                 const previousPricesWithNewFlag = previousPrice.map(p => ({ ...p, isNew: true }));
//                                                 onChange([...otherPrices, ...previousPricesWithNewFlag]);
//                                                 }}
//                                                 priceType="MINOR"
//                                                 logicType="QUANTITY_DISCOUNT"
//                                                 productId={productId}
//                                                 storeId={storeId}
//                                                 /> */}
//                                 </div>
//                                 {renderCategory(value, "MINOR", "QUANTITY_DISCOUNT")}
//                             </div>
//                             <div>
//                                 <div className="flex items-center justify-between">
//                                     <h3 className="font-semibold mb-2">Especial</h3>
//                                     {/* <GetPreviousPrices
//                                         onClick={(previousPrice) => {
//                                             if (previousPrice?.length === 0) {
//                                                 toast.error("No se encontró un precio anterior para este producto.");
//                                                 return
//                                                 };
//                                                 const otherPrices = value.filter(p => p.price_type !== "MINOR" || p.logic_type !== "SPECIAL");
//                                                 const previousPricesWithNewFlag = previousPrice.map(p => ({ ...p, isNew: true }));
//                                                 onChange([...otherPrices, ...previousPricesWithNewFlag]);
//                                                 }}
//                                                 priceType="MINOR"
//                                                 logicType="SPECIAL"
//                                                 productId={productId}
//                                                 storeId={storeId}
//                                                 /> */}
//                                 </div>
//                                 {renderCategory(value, "MINOR", "SPECIAL")}
//                             </div>
//                             <div>
//                                 <div className="flex items-center justify-between">
//                                     <h3 className="font-semibold mb-2">Oferta</h3>
//                                     {/* <GetPreviousPrices
//                                         onClick={(previousPrice) => {
//                                             if (previousPrice?.length === 0) {
//                                                 toast.error("No se encontró un precio anterior para este producto.");
//                                                 return
//                                                 };
//                                                 const otherPrices = value.filter(p => p.price_type !== "MINOR" || p.logic_type !== "LIMITED_OFFER");
//                                                 const previousPricesWithNewFlag = previousPrice.map(p => ({ ...p, isNew: true }));
//                                                 onChange([...otherPrices, ...previousPricesWithNewFlag]);
//                                                 }}
//                                                 priceType="MINOR"
//                                                 logicType="LIMITED_OFFER"
//                                                 productId={productId}
//                                                 storeId={storeId}
//                                                 /> */}
//                                 </div>
//                                 {renderCategory(value, "MINOR", "LIMITED_OFFER")}
//                             </div>
//                         </div>
//                     </TabsContent>

//                     {/* --- Mayorista --- */}
//                     <TabsContent value="MAYOR">
//                         <div className="grid grid-cols-3 gap-4">
//                             <div>
//                                 <div className="flex items-center justify-between">
//                                     <h3 className="font-semibold mb-2">Por cantidad</h3>
//                                     {/* <GetPreviousPrices
//                                         onClick={(previousPrice) => {
//                                             if (previousPrice?.length === 0) {
//                                                 toast.error("No se encontró un precio anterior para este producto.");
//                                                 return
//                                                 };
//                                                 const otherPrices = value.filter(p => p.price_type !== "MAYOR" || p.logic_type !== "QUANTITY_DISCOUNT");
//                                                 const previousPricesWithNewFlag = previousPrice.map(p => ({ ...p, isNew: true }));
//                                                 onChange([...otherPrices, ...previousPricesWithNewFlag]);
//                                                 }}
//                                                 priceType="MAYOR"
//                                                 logicType="QUANTITY_DISCOUNT"
//                                                 productId={productId}
//                                                 storeId={storeId}
//                                                 /> */}
//                                 </div>
//                                 {renderCategory(value, "MAYOR", "QUANTITY_DISCOUNT")}
//                             </div>
//                             <div>
//                                 <div className="flex items-center justify-between">
//                                     <h3 className="font-semibold mb-2">Especial</h3>
//                                     {/* <GetPreviousPrices
//                                         onClick={(previousPrice) => {
//                                             if (previousPrice?.length === 0) {
//                                                 toast.error("No se encontró un precio anterior para este producto.");
//                                                 return
//                                                 };
//                                                 const otherPrices = value.filter(p => p.price_type !== "MAYOR" || p.logic_type !== "SPECIAL");
//                                                 const previousPricesWithNewFlag = previousPrice.map(p => ({ ...p, isNew: true }));
//                                                 onChange([...otherPrices, ...previousPricesWithNewFlag]);
//                                                 }}
//                                                 priceType="MAYOR"
//                                                 logicType="SPECIAL"
//                                                 productId={productId}
//                                                 storeId={storeId}
//                                                 /> */}
//                                 </div>
//                                 {renderCategory(value, "MAYOR", "SPECIAL")}
//                             </div>
//                             <div>
//                                 <div className="flex items-center justify-between">
//                                     <h3 className="font-semibold mb-2">Oferta</h3>
//                                     {/* <GetPreviousPrices
//                                         onClick={(previousPrice) => {
//                                             if (previousPrice?.length === 0) {
//                                                 toast.error("No se encontró un precio anterior para este producto.");
//                                                 return
//                                                 };
//                                                 const otherPrices = value.filter(p => p.price_type !== "MAYOR" || p.logic_type !== "LIMITED_OFFER");
//                                                 const previousPricesWithNewFlag = previousPrice.map(p => ({ ...p, isNew: true }));
//                                                 onChange([...otherPrices, ...previousPricesWithNewFlag]);
//                                                 }}
//                                                 priceType="MAYOR"
//                                                 logicType="LIMITED_OFFER"
//                                                 productId={productId}
//                                                 storeId={storeId}
//                                                 /> */}
//                                 </div>
//                                 {renderCategory(value, "MAYOR", "LIMITED_OFFER")}
//                             </div>
//                         </div>
//                     </TabsContent>
//                 </Tabs>


//                 <CardFooter>
//                     {/* <DialogClose asChild>
//                         <Button onClick={handleCancel} variant="outline">Cancelar</Button>
//                         </DialogClose> */}
//                     <Button disabled={createPricesMutation.isLoading} onClick={handleCreatePrices} type="submit">Guardar</Button>
//                 </CardFooter>
//             </CardContent >
//         </Card >
//     );
// }


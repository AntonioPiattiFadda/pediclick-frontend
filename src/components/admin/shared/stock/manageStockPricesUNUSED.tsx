// import { pricesAdapter } from "@/adapters/prices";
// import { Button } from "@/components/ui/button";
// import {
//     Dialog,
//     DialogClose,
//     DialogContent,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle,
//     DialogTrigger,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Textarea } from "@/components/ui/textarea";
// import GetPreviousPrices from "@/components/admin/shared/stock/getPreviousPrice";
// import { createPrices, getStockPrices } from "@/service/prices";
// import type { Price, PriceLogicType } from "@/types/prices";
// import { pricesTypeAndLogicOptions } from "@/utils/prices";
// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { DollarSign, Percent, Plus, SquarePen, Trash2 } from "lucide-react";
// import { useEffect, useState } from "react";
// import { toast } from 'react-hot-toast';

// interface PricesDialogProps {
//     lotId: number;
//     lotNumber: number;
//     stockId: number;
//     loadOrderId: number;
//     // value: Price[];
//     // onChange: (prices: Price[]) => void;
//     disabled?: boolean;
//     cost_per_unit: number; // costo unitario base
//     storeId: number | null;
//     productId: number;
//     hasCost?: boolean;
// }

// export default function ManageStockPrices({
//     lotId,
//     stockId,
//     lotNumber,
//     loadOrderId,
//     // value,
//     // onChange,
//     disabled = false,
//     cost_per_unit,
//     storeId,
//     productId,
//     hasCost
// }: PricesDialogProps) {
//     console.log(productId)
//     const [open, setOpen] = useState(false);
//     const queryClient = useQueryClient();

//     const { data: stockPrices = [], isLoading } = useQuery({
//         queryKey: ["prices", stockId],
//         queryFn: async () => {
//             const response = await getStockPrices(stockId);
//             return response.stockPrices;
//         },
//         enabled: !!stockId,
//     });

//     console.log("stockPrices:", stockPrices);

//     const [value, onChange] = useState<Price[]>(stockPrices);
//     const [pricesToDelete, setPricesToDelete] = useState<number[]>([]);

//     useEffect(() => {
//         onChange(stockPrices);
//     }, [stockPrices]);

//     console.log("value:", value);

//     const createPricesMutation = useMutation({
//         mutationFn: async (adaptedPrices: Price[]) => {
//             return await createPrices(adaptedPrices, pricesToDelete);
//         },
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: ["load-order", Number(loadOrderId)], });
//             setOpen(false);
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
//         onChange(stockPrices);

//         // Inicializar: true si ya tiene observaciones, false si no
//         const initState: Record<string, boolean> = {};
//         stockPrices.forEach((p, idx) => {
//             const key = String(p.price_id ?? `new-${idx}`);
//             initState[key] = !!p.observations;
//         });
//         setShowObservations(initState);
//     }, [stockPrices]);

//     if (isLoading) return <div>Cargando precios...</div>;

//     // Helpers
//     const round2 = (n: number) => Math.round(n * 100) / 100;
//     const ensureUnits = (u?: number) => (u && u > 0 ? u : 1);

//     // === Recalc logic ===
//     function recalcFromPercentage(row: Price): Price {
//         const units = ensureUnits(row.qty_per_price);
//         const pct = row.profit_percentage ?? 0;
//         const perUnit = cost_per_unit * (1 + pct / 100);
//         const price = round2(perUnit * units);
//         return { ...row, qty_per_price: units, price };
//     }

//     function recalcFromUnitPrice(row: Price): Price {
//         const units = ensureUnits(row.qty_per_price);
//         const perUnit = row.price / units;
//         const profit_percentage = round2((perUnit / cost_per_unit - 1) * 100);
//         return { ...row, qty_per_price: units, profit_percentage };
//     }

//     function recalcFromUnits(row: Price, prevUnits?: number): Price {
//         const units = ensureUnits(row.qty_per_price);

//         if (Number.isFinite(row.profit_percentage)) {
//             const pct = row.profit_percentage ?? 0;
//             const perUnit = cost_per_unit * (1 + pct / 100);
//             const price = round2(perUnit * units);
//             return { ...row, qty_per_price: units, price };
//         }

//         const oldUnits = ensureUnits(prevUnits);
//         const prevPerUnit = row.price / oldUnits;
//         const price = round2(prevPerUnit * units);
//         const profit_percentage = round2((prevPerUnit / cost_per_unit - 1) * 100);
//         return { ...row, qty_per_price: units, price, profit_percentage };
//     }

//     type UpdateField = "profit_percentage" | "price" | "qty_per_price" | 'observations' | 'valid_until';

//     function updatePriceField(
//         prices: Price[],
//         priceId: number,
//         field: UpdateField,
//         value: string | number
//     ): Price[] {
//         return prices.map((row) => {
//             if (row.price_id !== priceId) return row;
//             const prevUnits = row.qty_per_price;
//             let next: Price = { ...row };

//             const toNumber = (v: string | number) =>
//                 typeof v === "number" ? v : parseFloat(v.replace(",", "."));

//             if (field === "profit_percentage") {
//                 const pct = toNumber(value);
//                 next.profit_percentage = Number.isFinite(pct) ? pct : 0;
//                 next = recalcFromPercentage(next);
//             }
//             if (field === "price") {
//                 const up = toNumber(value);
//                 next.price = Number.isFinite(up) ? up : 0;
//                 next = recalcFromUnitPrice(next);
//             }
//             if (field === "qty_per_price") {
//                 const units = toNumber(value);
//                 next.qty_per_price = Number.isFinite(units) ? Math.max(1, units) : 1;
//                 next = recalcFromUnits(next, prevUnits);
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
//                             {hasCost && (
//                                 <div className="relative">
//                                     <Percent className="absolute w-3 h-3 left-2 top-1/2 -translate-y-1/2 opacity-50" />
//                                     <Input
//                                         placeholder="Ganancia %"
//                                         className="pl-5"
//                                         value={price.profit_percentage}
//                                         disabled={disabled}
//                                         onChange={(e) =>
//                                             onChange(updatePriceField(value, price.price_id!, "profit_percentage", e.target.value))
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
//                                         onChange(updatePriceField(value, price.price_id!, "price", e.target.value))
//                                     }
//                                 />
//                             </div>

//                             <Input
//                                 placeholder="Unidades"
//                                 value={price.qty_per_price}
//                                 disabled={disabled}
//                                 onChange={(e) =>
//                                     onChange(updatePriceField(value, price.price_id!, "qty_per_price", e.target.value))
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
//                             <Textarea
//                                 placeholder="Observaciones"
//                                 value={price.observations ?? ""}
//                                 disabled={disabled}
//                                 onChange={(e) =>
//                                     onChange(updatePriceField(value, price.price_id!, "observations", e.target.value))
//                                 }
//                             />
//                         ) : (
//                             <Button
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
//                                         onChange(updatePriceField(value, price.price_id!, "valid_until", e.target.value))
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
//                             price: cost_per_unit,
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

//     const handleCancel = () => {
//         setOpen(false);
//         onChange(stockPrices); // Reset to original prices on cancel
//     }

//     return (
//         <Dialog open={open} onOpenChange={() => {
//             setOpen(!open);
//         }}>
//             <DialogTrigger asChild>
//                 <div className="flex items-center">
//                     {value.length !== 0 && (

//                         <div className="flex flex-col">
//                             {value
//                                 .map((p) =>
//                                     <span className="text-sm text-gray-600">{`$${p.price} (${pricesTypeAndLogicOptions.price_type.find(option => option.value === p.price_type)?.label}/${pricesTypeAndLogicOptions.logic_type.find(option => option.value === p.logic_type)?.label})`}</span>)}
//                         </div>
//                     )}
//                     <Button variant="default" className="ml-2">
//                         <SquarePen />
//                     </Button>
//                 </div>
//             </DialogTrigger>
//             <DialogContent className="max-w-[1100px]">
//                 <DialogHeader>
//                     <DialogTitle>Precios del lote {lotNumber}</DialogTitle>
//                 </DialogHeader>

//                 {isLoading ? (
//                     <p>Cargando precios...</p>
//                 ) : (
//                     <Tabs defaultValue="MINOR" className="w-full">
//                         <TabsList className="grid grid-cols-2 w-full mb-4">
//                             <TabsTrigger value="MINOR">Minorista</TabsTrigger>
//                             <TabsTrigger value="MAYOR">Mayorista</TabsTrigger>
//                         </TabsList>

//                         {/* --- Minorista --- */}
//                         <TabsContent value="MINOR">
//                             <div className="grid grid-cols-3 gap-4">
//                                 <div>
//                                     <div className="flex items-center justify-between">
//                                         <h3 className="font-semibold mb-2">Por cantidad</h3>
//                                         <GetPreviousPrices
//                                             onClick={(previousPrice) => {
//                                                 if (previousPrice?.length === 0) {
//                                                     toast.error("No se encontró un precio anterior para este producto.");
//                                                     return
//                                                 };
//                                                 const otherPrices = value.filter(p => p.price_type !== "MINOR" || p.logic_type !== "QUANTITY_DISCOUNT");
//                                                 const previousPricesWithNewFlag = previousPrice.map(p => ({ ...p, isNew: true }));
//                                                 onChange([...otherPrices, ...previousPricesWithNewFlag]);
//                                             }}
//                                             priceType="MINOR"
//                                             logicType="QUANTITY_DISCOUNT"
//                                             productId={productId}
//                                             storeId={storeId}
//                                         />
//                                     </div>
//                                     {renderCategory(value, "MINOR", "QUANTITY_DISCOUNT")}
//                                 </div>
//                                 <div>
//                                     <div className="flex items-center justify-between">
//                                         <h3 className="font-semibold mb-2">Especial</h3>
//                                         <GetPreviousPrices
//                                             onClick={(previousPrice) => {
//                                                 if (previousPrice?.length === 0) {
//                                                     toast.error("No se encontró un precio anterior para este producto.");
//                                                     return
//                                                 };
//                                                 const otherPrices = value.filter(p => p.price_type !== "MINOR" || p.logic_type !== "SPECIAL");
//                                                 const previousPricesWithNewFlag = previousPrice.map(p => ({ ...p, isNew: true }));
//                                                 onChange([...otherPrices, ...previousPricesWithNewFlag]);
//                                             }}
//                                             priceType="MINOR"
//                                             logicType="SPECIAL"
//                                             productId={productId}
//                                             storeId={storeId}
//                                         />
//                                     </div>
//                                     {renderCategory(value, "MINOR", "SPECIAL")}
//                                 </div>
//                                 <div>
//                                     <div className="flex items-center justify-between">
//                                         <h3 className="font-semibold mb-2">Oferta</h3>
//                                         <GetPreviousPrices
//                                             onClick={(previousPrice) => {
//                                                 if (previousPrice?.length === 0) {
//                                                     toast.error("No se encontró un precio anterior para este producto.");
//                                                     return
//                                                 };
//                                                 const otherPrices = value.filter(p => p.price_type !== "MINOR" || p.logic_type !== "LIMITED_OFFER");
//                                                 const previousPricesWithNewFlag = previousPrice.map(p => ({ ...p, isNew: true }));
//                                                 onChange([...otherPrices, ...previousPricesWithNewFlag]);
//                                             }}
//                                             priceType="MINOR"
//                                             logicType="LIMITED_OFFER"
//                                             productId={productId}
//                                             storeId={storeId}
//                                         />
//                                     </div>
//                                     {renderCategory(value, "MINOR", "LIMITED_OFFER")}
//                                 </div>
//                             </div>
//                         </TabsContent>

//                         {/* --- Mayorista --- */}
//                         <TabsContent value="MAYOR">
//                             <div className="grid grid-cols-3 gap-4">
//                                 <div>
//                                     <div className="flex items-center justify-between">
//                                         <h3 className="font-semibold mb-2">Por cantidad</h3>
//                                         <GetPreviousPrices
//                                             onClick={(previousPrice) => {
//                                                 if (previousPrice?.length === 0) {
//                                                     toast.error("No se encontró un precio anterior para este producto.");
//                                                     return
//                                                 };
//                                                 const otherPrices = value.filter(p => p.price_type !== "MAYOR" || p.logic_type !== "QUANTITY_DISCOUNT");
//                                                 const previousPricesWithNewFlag = previousPrice.map(p => ({ ...p, isNew: true }));
//                                                 onChange([...otherPrices, ...previousPricesWithNewFlag]);
//                                             }}
//                                             priceType="MAYOR"
//                                             logicType="QUANTITY_DISCOUNT"
//                                             productId={productId}
//                                             storeId={storeId}
//                                         />
//                                     </div>
//                                     {renderCategory(value, "MAYOR", "QUANTITY_DISCOUNT")}
//                                 </div>
//                                 <div>
//                                     <div className="flex items-center justify-between">
//                                         <h3 className="font-semibold mb-2">Especial</h3>
//                                         <GetPreviousPrices
//                                             onClick={(previousPrice) => {
//                                                 if (previousPrice?.length === 0) {
//                                                     toast.error("No se encontró un precio anterior para este producto.");
//                                                     return
//                                                 };
//                                                 const otherPrices = value.filter(p => p.price_type !== "MAYOR" || p.logic_type !== "SPECIAL");
//                                                 const previousPricesWithNewFlag = previousPrice.map(p => ({ ...p, isNew: true }));
//                                                 onChange([...otherPrices, ...previousPricesWithNewFlag]);
//                                             }}
//                                             priceType="MAYOR"
//                                             logicType="SPECIAL"
//                                             productId={productId}
//                                             storeId={storeId}
//                                         />
//                                     </div>
//                                     {renderCategory(value, "MAYOR", "SPECIAL")}
//                                 </div>
//                                 <div>
//                                     <div className="flex items-center justify-between">
//                                         <h3 className="font-semibold mb-2">Oferta</h3>
//                                         <GetPreviousPrices
//                                             onClick={(previousPrice) => {
//                                                 if (previousPrice?.length === 0) {
//                                                     toast.error("No se encontró un precio anterior para este producto.");
//                                                     return
//                                                 };
//                                                 const otherPrices = value.filter(p => p.price_type !== "MAYOR" || p.logic_type !== "LIMITED_OFFER");
//                                                 const previousPricesWithNewFlag = previousPrice.map(p => ({ ...p, isNew: true }));
//                                                 onChange([...otherPrices, ...previousPricesWithNewFlag]);
//                                             }}
//                                             priceType="MAYOR"
//                                             logicType="LIMITED_OFFER"
//                                             productId={productId}
//                                             storeId={storeId}
//                                         />
//                                     </div>
//                                     {renderCategory(value, "MAYOR", "LIMITED_OFFER")}
//                                 </div>
//                             </div>
//                         </TabsContent>
//                     </Tabs>
//                 )}
//                 <DialogFooter>
//                     <DialogClose asChild>
//                         <Button onClick={handleCancel} variant="outline">Cancelar</Button>
//                     </DialogClose>
//                     <Button disabled={createPricesMutation.isLoading} onClick={handleCreatePrices} type="submit">Guardar</Button>
//                 </DialogFooter>
//             </DialogContent>
//         </Dialog>
//     );
// }

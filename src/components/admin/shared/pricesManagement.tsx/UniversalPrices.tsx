import { pricesAdapter } from '@/adapters/prices';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { createPrices } from '@/service/prices';
import type { Price, PriceLogicType, PriceType } from '@/types/prices';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Percent, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const UniversalPrices = ({ productPresentationId, finalCost, disabled, productPrices }: {
    productPresentationId: number;
    finalCost: {
        final_cost_total: number | null;
        final_cost_per_unit: number | null;
        final_cost_per_bulk: number | null;
    };
    disabled?: boolean;
    productPrices: Price[];
}) => {

    const queryClient = useQueryClient();


    const [value, onChange] = useState<Price[]>(productPrices);

    const [pricesToDelete, setPricesToDelete] = useState<number[]>([]);


    const createPricesMutation = useMutation({
        mutationFn: async (adaptedPrices: Price[]) => {
            return await createPrices(adaptedPrices, pricesToDelete);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["prices", productPresentationId], });
            toast.success("Precios actualizados correctamente");
        },
        onError: (error: {
            message: string;
        }) => {
            const errorMessage = error.message;
            toast.error(errorMessage || "Error al crear precios")
        },
    });

    const [showObservations, setShowObservations] = useState<Record<string, boolean>>({});

    // useEffect(() => {
    //     // Inicializar: true si ya tiene observaciones, false si no
    //     const initState: Record<string, boolean> = {};
    //     productPrices.forEach((p, idx) => {
    //         const key = String(p.price_id ?? `new-${idx}`);
    //         initState[key] = !!p.observations;
    //     });
    //     setShowObservations(initState);
    // }, [productPrices]);


    // Helpers
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const ensureUnits = (u?: number) => (u && u > 0 ? u : 1);

    // === Recalc logic ===
    function recalcFromPercentage(row: Price, price_type: PriceType): Price {
        if (!finalCost?.final_cost_per_unit || !finalCost?.final_cost_per_bulk) return row;
        const units = ensureUnits(row.qty_per_price);
        const pct = row.profit_percentage ?? 0;
        const perUnit = price_type === "MINOR" ? finalCost?.final_cost_per_unit * (1 + pct / 100) : finalCost?.final_cost_per_bulk * (1 + pct / 100);
        const price = round2(perUnit * units);
        return { ...row, qty_per_price: units, price };
    }

    function recalcFromPrice(row: Price, price_type: PriceType): Price {

        if (!finalCost?.final_cost_per_unit || !finalCost?.final_cost_per_bulk) return row;
        // const units = row.qty_per_price;
        const profit_percentage = price_type === "MINOR" ?
            row.price * 100 / (finalCost?.final_cost_per_unit * row.qty_per_price) - 100
            :
            row.price * 100 / (finalCost?.final_cost_per_bulk * row.qty_per_price) - 100
            ;

        return { ...row, profit_percentage };
    }

    // function recalcFromUnits(row: Price, prevUnits?: number, price_type: PriceType): Price {
    //     const units = ensureUnits(row.qty_per_price);

    //     if (Number.isFinite(row.profit_percentage)) {
    //         const pct = row.profit_percentage ?? 0;
    //         const perUnit = price_type === "MINOR" ? finalCost?.final_cost_per_unit * (1 + pct / 100) : finalCost?.final_cost_per_bulk * (1 + pct / 100);
    //         const price = round2(perUnit * units);
    //         return { ...row, qty_per_price: units, price };
    //     }

    //     const oldUnits = ensureUnits(prevUnits);
    //     const prevPerUnit = row.price / oldUnits;
    //     const price = round2(prevPerUnit * units);
    //     const profit_percentage = round2((prevPerUnit / finalCost.final_cost_per_unit - 1) * 100);


    //     return { ...row, qty_per_price: units, price, profit_percentage };
    // }

    type UpdateField = "profit_percentage" | "price" | "qty_per_price" | 'observations' | 'valid_until';

    function updatePriceField(
        prices: Price[],
        priceId: number,
        field: UpdateField,
        value: string | number,
        price_type: PriceType
    ): Price[] {
        return prices.map((row) => {
            if (row.price_id !== priceId) return row;
            // const prevUnits = row.qty_per_price;
            let next: Price = { ...row };

            const toNumber = (v: string | number) =>
                typeof v === "number" ? v : parseFloat(v.replace(",", "."));

            if (field === "profit_percentage") {
                const pct = toNumber(value);
                next.profit_percentage = Number.isFinite(pct) ? pct : 0;
                next = recalcFromPercentage(next, price_type);
            }
            if (field === "price") {
                const up = toNumber(value);
                next.price = Number.isFinite(up) ? up : 0;
                next = recalcFromPrice(next, price_type);
            }
            if (field === "qty_per_price") {
                const units = toNumber(value);
                next.qty_per_price = Number.isFinite(units) ? Math.max(1, units) : 1;

                // next = recalcFromUnits(next, prevUnits, price_type);
            }

            if (field === 'observations') {
                next.observations = String(value);
            }

            if (field === 'valid_until') {
                next.valid_until = String(value);
            }

            return next;
        });
    }


    // === Render category ===
    function renderCategory(prices: Price[], price_type: "MINOR" | "MAYOR", logic_type: PriceLogicType) {
        const filtered = prices
            .filter((p) => p.price_type === price_type && p.logic_type === logic_type)
            .sort((a, b) => a.price_number - b.price_number);
        const isLimitedOffer = logic_type === "LIMITED_OFFER";
        return (
            <div className="space-y-2">
                {filtered.map((price, index) => {
                    const key = String(price.price_id ?? `new-${index}`);
                    const isVisible = showObservations[key] ?? false;
                    return <div key={index} className="flex flex-col gap-1">
                        <div

                            className="grid grid-cols-[1fr_1fr_1fr_40px] gap-2 items-center"
                        >
                            {finalCost?.final_cost_total && (
                                <div className="relative">
                                    <Percent className="absolute w-3 h-3 left-2 top-1/2 -translate-y-1/2 opacity-50" />
                                    <Input
                                        placeholder="Ganancia %"
                                        className="pl-5"
                                        value={price.profit_percentage}
                                        disabled={disabled}
                                        onChange={(e) =>
                                            onChange(updatePriceField(value, price.price_id!, "profit_percentage", e.target.value, price_type))
                                        }
                                    />
                                </div>
                            )}
                            <div className="relative">
                                <DollarSign className="absolute w-3 h-3 left-2 top-1/2 -translate-y-1/2 opacity-50" />
                                <Input
                                    placeholder="Precio total"
                                    className="pl-5"
                                    value={price.price}
                                    disabled={disabled}
                                    onChange={(e) =>
                                        onChange(updatePriceField(value, price.price_id!, "price", e.target.value, price_type))
                                    }
                                />
                            </div>

                            <Input
                                placeholder="Unidades"
                                value={price.qty_per_price}
                                disabled={disabled}
                                onChange={(e) =>
                                    onChange(updatePriceField(value, price.price_id!, "qty_per_price", e.target.value, price_type))
                                }
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled={disabled}
                                onClick={() => {
                                    onChange(value.filter((p) => p.price_id !== price.price_id))
                                    if (price.price_id && !price.is_new) {
                                        setPricesToDelete((prev) => [...prev, price.price_id!]);
                                    }
                                }}
                            >
                                <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                        </div>
                        {isVisible ? (
                            <div className="relative">
                                <Textarea
                                    placeholder="Observaciones"
                                    value={price.observations ?? ""}
                                    disabled={disabled}
                                    onChange={(e) =>
                                        onChange(updatePriceField(value, price.price_id!, "observations", e.target.value, price_type))
                                    }

                                />
                                <button
                                    className="absolute top-1 right-1 "
                                    onClick={() => {
                                        setShowObservations((prev) => ({
                                            ...prev,
                                            [key]: false,
                                        }))
                                        onChange(updatePriceField(value, price.price_id!, "observations", "", price_type))
                                    }}><X className="w-4 h-4 cursor-pointer" /></button>
                            </div>
                        ) : (
                            <Button
                                className={`${logic_type === "QUANTITY_DISCOUNT" ? "hidden" : ""}`}
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={disabled}
                                onClick={() =>
                                    setShowObservations((prev) => ({
                                        ...prev,
                                        [key]: true,
                                    }))
                                }
                            >
                                + Agregar observación
                            </Button>
                        )}

                        {isLimitedOffer && (
                            <div className="flex gap-2">
                                <label>Válido hasta</label>
                                <input
                                    type="date"
                                    value={price.valid_until ? price.valid_until.split('T')[0] : ''}
                                    onChange={(e) =>
                                        onChange(updatePriceField(value, price.price_id!, "valid_until", e.target.value, price_type))
                                    }
                                    className="border border-gray-300 rounded px-2 py-1"
                                />

                            </div>
                        )}
                    </div>
                })}
                <Button
                    variant="outline"
                    disabled={disabled}
                    onClick={() => {
                        const newPrice: Price = {
                            price_id: Math.random(), // Temporal, se reemplaza al guardar
                            is_new: true,
                            product_presentation_id: productPresentationId,
                            store_id: null,
                            price_number: value.length + 1,
                            price: 0,
                            qty_per_price: 1,
                            profit_percentage: 0,
                            price_type,
                            logic_type,
                            observations: null,
                            is_limited_offer: logic_type === "LIMITED_OFFER",
                            is_active: true,
                            valid_from: null,
                            valid_until: null,
                        };
                        onChange([...value, newPrice]);
                    }}
                >
                    <Plus className="w-4 h-4" /> Agregar precio
                </Button>
            </div>
        );
    }

    const handleCreatePrices = async () => {
        // TODO Validar los precios aca
        const adaptedPrices = pricesAdapter(value, null);
        createPricesMutation.mutate(adaptedPrices);
    }

    // const handleCancel = () => {
    //     onChange(productPrices); // Reset to original prices on cancel
    // }




    return (
        <TabsContent value={'all-stores'}>



            <Tabs defaultValue="MINOR" className="w-full">
                <TabsList className="grid grid-cols-2 w-full mb-4">
                    <TabsTrigger value="MINOR">Minorista</TabsTrigger>
                    <TabsTrigger value="MAYOR">Mayorista</TabsTrigger>
                </TabsList>






                {/* --- Minorista --- */}
                <TabsContent value="MINOR">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold mb-2">Por cantidad</h3>
                                {/* <GetPreviousPrices
                                        onClick={(previousPrice) => {
                                            if (previousPrice?.length === 0) {
                                                toast.error("No se encontró un precio anterior para este producto.");
                                                return
                                            };
                                            const otherPrices = value.filter(p => p.price_type !== "MINOR" || p.logic_type !== "QUANTITY_DISCOUNT");
                                            const previousPricesWithNewFlag = previousPrice.map(p => ({ ...p, is_new: true }));
                                            onChange([...otherPrices, ...previousPricesWithNewFlag]);
                                        }}
                                        priceType="MINOR"
                                        logicType="QUANTITY_DISCOUNT"
                                        productId={productId}
                                        storeId={storeId}
                                    /> */}
                            </div>
                            {renderCategory(value, "MINOR", "QUANTITY_DISCOUNT")}
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold mb-2">Especial</h3>
                                {/* <GetPreviousPrices
                                        onClick={(previousPrice) => {
                                            if (previousPrice?.length === 0) {
                                                toast.error("No se encontró un precio anterior para este producto.");
                                                return
                                            };
                                            const otherPrices = value.filter(p => p.price_type !== "MINOR" || p.logic_type !== "SPECIAL");
                                            const previousPricesWithNewFlag = previousPrice.map(p => ({ ...p, is_new: true }));
                                            onChange([...otherPrices, ...previousPricesWithNewFlag]);
                                        }}
                                        priceType="MINOR"
                                        logicType="SPECIAL"
                                        productId={productId}
                                        storeId={storeId}
                                    /> */}
                            </div>
                            {renderCategory(value, "MINOR", "SPECIAL")}
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold mb-2">Oferta</h3>
                                {/* <GetPreviousPrices
                                        onClick={(previousPrice) => {
                                            if (previousPrice?.length === 0) {
                                                toast.error("No se encontró un precio anterior para este producto.");
                                                return
                                            };
                                            const otherPrices = value.filter(p => p.price_type !== "MINOR" || p.logic_type !== "LIMITED_OFFER");
                                            const previousPricesWithNewFlag = previousPrice.map(p => ({ ...p, is_new: true }));
                                            onChange([...otherPrices, ...previousPricesWithNewFlag]);
                                        }}
                                        priceType="MINOR"
                                        logicType="LIMITED_OFFER"
                                        productId={productId}
                                        storeId={storeId}
                                    /> */}
                            </div>
                            {renderCategory(value, "MINOR", "LIMITED_OFFER")}
                        </div>
                    </div>
                </TabsContent>

                {/* --- Mayorista --- */}
                <TabsContent value="MAYOR">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold mb-2">Por cantidad</h3>
                                {/* <GetPreviousPrices
                                        onClick={(previousPrice) => {
                                            if (previousPrice?.length === 0) {
                                                toast.error("No se encontró un precio anterior para este producto.");
                                                return
                                            };
                                            const otherPrices = value.filter(p => p.price_type !== "MAYOR" || p.logic_type !== "QUANTITY_DISCOUNT");
                                            const previousPricesWithNewFlag = previousPrice.map(p => ({ ...p, is_new: true }));
                                            onChange([...otherPrices, ...previousPricesWithNewFlag]);
                                        }}
                                        priceType="MAYOR"
                                        logicType="QUANTITY_DISCOUNT"
                                        productId={productId}
                                        storeId={storeId}
                                    /> */}
                            </div>
                            {renderCategory(value, "MAYOR", "QUANTITY_DISCOUNT")}
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold mb-2">Especial</h3>
                                {/* <GetPreviousPrices
                                        onClick={(previousPrice) => {
                                            if (previousPrice?.length === 0) {
                                                toast.error("No se encontró un precio anterior para este producto.");
                                                return
                                            };
                                            const otherPrices = value.filter(p => p.price_type !== "MAYOR" || p.logic_type !== "SPECIAL");
                                            const previousPricesWithNewFlag = previousPrice.map(p => ({ ...p, is_new: true }));
                                            onChange([...otherPrices, ...previousPricesWithNewFlag]);
                                        }}
                                        priceType="MAYOR"
                                        logicType="SPECIAL"
                                        productId={productId}
                                        storeId={storeId}
                                    /> */}
                            </div>
                            {renderCategory(value, "MAYOR", "SPECIAL")}
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold mb-2">Oferta</h3>
                                {/* <GetPreviousPrices
                                        onClick={(previousPrice) => {
                                            if (previousPrice?.length === 0) {
                                                toast.error("No se encontró un precio anterior para este producto.");
                                                return
                                            };
                                            const otherPrices = value.filter(p => p.price_type !== "MAYOR" || p.logic_type !== "LIMITED_OFFER");
                                            const previousPricesWithNewFlag = previousPrice.map(p => ({ ...p, is_new: true }));
                                            onChange([...otherPrices, ...previousPricesWithNewFlag]);
                                        }}
                                        priceType="MAYOR"
                                        logicType="LIMITED_OFFER"
                                        productId={productId}
                                        storeId={storeId}
                                    /> */}
                            </div>
                            {renderCategory(value, "MAYOR", "LIMITED_OFFER")}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>


            <CardFooter className='mt-14 p-0 flex justify-end'>
                {/* <DialogClose asChild>
                        <Button onClick={handleCancel} variant="outline">Cancelar</Button>
                    </DialogClose> */}
                <Button disabled={createPricesMutation.isLoading} onClick={handleCreatePrices} type="submit">Guardar</Button>
            </CardFooter>
        </TabsContent>
    )
}

export default UniversalPrices
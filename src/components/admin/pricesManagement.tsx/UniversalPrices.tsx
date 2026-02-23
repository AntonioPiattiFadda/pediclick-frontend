import { pricesAdapter } from '@/adapters/prices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { createPrices } from '@/service/prices';
import type { Price, PriceLogicType } from '@/types/prices';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Percent, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

const UniversalPrices = ({
    productPresentationId, finalCost, disabled, productPrices
}: {
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
    const [showObservations, setShowObservations] = useState<Record<string, boolean>>({});

    // Sync value with fresh server data after invalidation+refetch
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        onChange(productPrices);
    }, [productPrices]);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

    const saveMutation = useMutation({
        mutationFn: async ({ prices, toDelete }: { prices: Price[]; toDelete: number[] }) => {
            return await createPrices(prices, toDelete);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["prices", productPresentationId] });
            queryClient.invalidateQueries({ queryKey: ["disabled_prices", productPresentationId] });
        },
        onError: (error: { message: string }) => {
            toast.error(error.message || "Error al guardar precios");
        },
    });

    const saveDebounced = (prices: Price[]) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            saveMutation.mutate({ prices: pricesAdapter(prices, null), toDelete: [] });
        }, 800);
    };

    const saveImmediate = (prices: Price[], toDelete: number[] = []) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        saveMutation.mutate({ prices: pricesAdapter(prices, null), toDelete });
    };

    // Helpers
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const ensureUnits = (u?: number) => (u && u > 0 ? u : 1);

    function recalcFromPercentage(row: Price): Price {
        if (!finalCost?.final_cost_per_unit) return row;
        const units = ensureUnits(row.qty_per_price);
        const pct = row.profit_percentage ?? 0;
        const price = round2(finalCost.final_cost_per_unit * (1 + pct / 100) * units);
        return { ...row, qty_per_price: units, price };
    }

    function recalcFromPrice(row: Price): Price {
        if (!finalCost?.final_cost_per_unit) return row;
        const profit_percentage =
            (row.price * 100) / (finalCost.final_cost_per_unit * row.qty_per_price) - 100;
        return { ...row, profit_percentage };
    }

    type UpdateField = "profit_percentage" | "price" | "qty_per_price" | "observations" | "valid_until";

    function updatePriceField(prices: Price[], priceId: number, field: UpdateField, val: string | number): Price[] {
        return prices.map((row) => {
            if (row.price_id !== priceId) return row;
            let next: Price = { ...row };
            const toNumber = (v: string | number) =>
                typeof v === "number" ? v : parseFloat(v.replace(",", "."));

            if (field === "profit_percentage") {
                const pct = toNumber(val);
                next.profit_percentage = Number.isFinite(pct) ? pct : 0;
                next = recalcFromPercentage(next);
            }
            if (field === "price") {
                const up = toNumber(val);
                next.price = Number.isFinite(up) ? up : 0;
                next = recalcFromPrice(next);
            }
            if (field === "qty_per_price") {
                const units = toNumber(val);
                next.qty_per_price = Number.isFinite(units) ? Math.max(1, units) : 1;
            }
            if (field === "observations") next.observations = String(val);
            if (field === "valid_until") next.valid_until = String(val);

            return next;
        });
    }

    function renderCategory(prices: Price[], logic_type: PriceLogicType) {
        const filtered = prices
            .filter((p) => p.logic_type === logic_type)
            .sort((a, b) => a.price_number - b.price_number);
        const isLimitedOffer = logic_type === "LIMITED_OFFER";

        return (
            <div className="space-y-2">
                {filtered.map((price, index) => {
                    const key = String(price.price_id ?? `new-${index}`);
                    const isVisible = showObservations[key] ?? false;
                    return (
                        <div key={index} className="flex flex-col gap-1">
                            <div className="grid grid-cols-[1fr_1fr_1fr_40px] gap-2 items-center">
                                {finalCost?.final_cost_total && (
                                    <div className="relative">
                                        <Percent className="absolute w-3 h-3 left-2 top-1/2 -translate-y-1/2 opacity-50" />
                                        <Input
                                            type="number"
                                            placeholder="Ganancia %"
                                            className="pl-5"
                                            value={price.profit_percentage || undefined}
                                            disabled={disabled}
                                            onChange={(e) => {
                                                const next = updatePriceField(value, price.price_id!, "profit_percentage", e.target.value);
                                                onChange(next);
                                                saveDebounced(next);
                                            }}
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
                                        onChange={(e) => {
                                            const next = updatePriceField(value, price.price_id!, "price", e.target.value);
                                            onChange(next);
                                            saveDebounced(next);
                                        }}
                                    />
                                </div>
                                <Input
                                    placeholder="Unidades"
                                    value={price.qty_per_price}
                                    disabled={disabled}
                                    onChange={(e) => {
                                        const next = updatePriceField(value, price.price_id!, "qty_per_price", e.target.value);
                                        onChange(next);
                                        saveDebounced(next);
                                    }}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={disabled}
                                    onClick={() => {
                                        const next = value.filter((p) => p.price_id !== price.price_id);
                                        onChange(next);
                                        if (!price.is_new) {
                                            saveImmediate(next, [price.price_id!]);
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
                                        onChange={(e) => {
                                            const next = updatePriceField(value, price.price_id!, "observations", e.target.value);
                                            onChange(next);
                                            saveDebounced(next);
                                        }}
                                    />
                                    <button
                                        className="absolute top-1 right-1"
                                        onClick={() => {
                                            setShowObservations((prev) => ({ ...prev, [key]: false }));
                                            const next = updatePriceField(value, price.price_id!, "observations", "");
                                            onChange(next);
                                            saveDebounced(next);
                                        }}
                                    >
                                        <X className="w-4 h-4 cursor-pointer" />
                                    </button>
                                </div>
                            ) : (
                                <Button
                                    className={logic_type === "QUANTITY_DISCOUNT" ? "hidden" : ""}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={disabled}
                                    onClick={() => setShowObservations((prev) => ({ ...prev, [key]: true }))}
                                >
                                    + Agregar observación
                                </Button>
                            )}

                            {isLimitedOffer && (
                                <div className="flex gap-2 items-center">
                                    <label>Válido hasta</label>
                                    <input
                                        type="date"
                                        value={price.valid_until ? price.valid_until.split("T")[0] : ""}
                                        onChange={(e) => {
                                            const next = updatePriceField(value, price.price_id!, "valid_until", e.target.value);
                                            onChange(next);
                                            saveDebounced(next);
                                        }}
                                        className="border border-gray-300 rounded px-2 py-1"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
                <Button
                    variant="outline"
                    disabled={disabled}
                    onClick={() => {
                        const newPrice: Price = {
                            price_id: Math.random(),
                            is_new: true,
                            product_presentation_id: productPresentationId,
                            location_id: null,
                            price_number: value.length + 1,
                            price: 0,
                            qty_per_price: 1,
                            profit_percentage: 0,
                            logic_type,
                            observations: null,
                            is_active: true,
                            valid_from: null,
                            valid_until: null,
                        };
                        const next = [...value, newPrice];
                        onChange(next);
                        saveImmediate(next);
                    }}
                >
                    <Plus className="w-4 h-4" /> Agregar precio
                </Button>
            </div>
        );
    }

    return (
        <TabsContent value="all-stores">
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <h3 className="font-semibold mb-2">Por cantidad</h3>
                    {renderCategory(value, "QUANTITY_DISCOUNT")}
                </div>
                <div>
                    <h3 className="font-semibold mb-2">Especial</h3>
                    {renderCategory(value, "SPECIAL")}
                </div>
                <div>
                    <h3 className="font-semibold mb-2">Oferta</h3>
                    {renderCategory(value, "LIMITED_OFFER")}
                </div>
            </div>
        </TabsContent>
    );
};

export default UniversalPrices;

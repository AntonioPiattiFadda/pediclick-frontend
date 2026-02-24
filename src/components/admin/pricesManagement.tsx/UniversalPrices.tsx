import { pricesAdapter } from '@/adapters/prices';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { getClients } from '@/service/clients';
import { addClientToPrice, createPrices, removeClientFromPrice } from '@/service/prices';
import type { Client } from '@/types/clients';
import type { Price, PriceLogicType } from '@/types/prices';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoneyInput } from '@/components/admin/ui/MoneyInput';
import { Percent, Plus, Trash2, X } from 'lucide-react';
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

    const valueRef = useRef<Price[]>(productPrices);
    const hasPendingRef = useRef(false);

    // Sync with server data only when there are no pending local edits
    useEffect(() => {
        if (!hasPendingRef.current) onChange(productPrices);
    }, [productPrices]);

    // Save on unmount (safety net for sheet close)
    useEffect(() => {
        return () => {
            if (hasPendingRef.current) {
                createPrices(pricesAdapter(valueRef.current, null), []);
            }
        };
    }, []);

    const { data: allClients = [] } = useQuery({
        queryKey: ["clients"],
        queryFn: async () => {
            const response = await getClients();
            return response.clients ?? [];
        },
        staleTime: 5 * 60 * 1000,
    });

    const saveMutation = useMutation({
        mutationFn: async ({ prices, toDelete }: { prices: Price[]; toDelete: number[] }) => {
            return await createPrices(prices, toDelete);
        },
        onError: (error: { message: string }) => {
            toast.error(error.message || "Error al guardar precios");
        },
    });

    const addPriceMutation = useMutation({
        mutationFn: async (newPrice: Price) => {
            return await createPrices(pricesAdapter([newPrice], null), []);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["prices", productPresentationId, null] });
        },
        onError: (error: { message: string }) => {
            toast.error(error.message || "Error al agregar precio");
        },
    });

    const addClientMutation = useMutation({
        mutationFn: ({ priceId, clientId }: { priceId: number; clientId: number }) =>
            addClientToPrice(priceId, clientId),
        onSuccess: (_, { priceId, clientId }) => {
            onChange(prev => prev.map(p =>
                p.price_id !== priceId ? p : {
                    ...p,
                    enabled_prices_clients: [...(p.enabled_prices_clients ?? []), { client_id: clientId }]
                }
            ));
        },
        onError: (error: { message: string }) => toast.error(error.message || "Error al agregar cliente"),
    });

    const removeClientMutation = useMutation({
        mutationFn: ({ priceId, clientId }: { priceId: number; clientId: number }) =>
            removeClientFromPrice(priceId, clientId),
        onSuccess: (_, { priceId, clientId }) => {
            onChange(prev => prev.map(p =>
                p.price_id !== priceId ? p : {
                    ...p,
                    enabled_prices_clients: (p.enabled_prices_clients ?? []).filter(ec => ec.client_id !== clientId)
                }
            ));
        },
        onError: (error: { message: string }) => toast.error(error.message || "Error al quitar cliente"),
    });

    const saveImmediate = (prices: Price[], toDelete: number[] = []) => {
        saveMutation.mutate({ prices: pricesAdapter(prices, null), toDelete });
    };

    const markAndSet = (next: Price[]) => {
        valueRef.current = next;
        hasPendingRef.current = true;
        onChange(next);
    };

    const saveOnRowBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node) && hasPendingRef.current) {
            saveImmediate(valueRef.current);
            hasPendingRef.current = false;
        }
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
            .sort((a, b) => (a.qty_per_price ?? 0) - (b.qty_per_price ?? 0));
        const isLimitedOffer = logic_type === "LIMITED_OFFER";
        const isSpecial = logic_type === "SPECIAL";

        return (
            <div className="space-y-2">
                {filtered.map((price, index) => {
                    const key = String(price.price_id ?? `new-${index}`);
                    const isVisible = showObservations[key] ?? false;
                    const enabledClients = price.enabled_prices_clients ?? [];
                    const availableClients = (allClients as Client[]).filter(
                        (c) => !enabledClients.some((ec) => ec.client_id === c.client_id)
                    );

                    return (
                        <div key={index} className="flex flex-col gap-1" onBlur={saveOnRowBlur}>
                            <div className="grid grid-cols-[auto_auto_auto_40px] gap-2 items-center">
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
                                                markAndSet(updatePriceField(value, price.price_id!, "profit_percentage", e.target.value));
                                            }}
                                        />
                                    </div>
                                )}
                                <MoneyInput
                                    value={price.price}
                                    disabled={disabled}
                                    onChange={(v) => {
                                        markAndSet(updatePriceField(value, price.price_id!, "price", v ?? 0));
                                    }}
                                />
                                <Input
                                    type="number"
                                    placeholder="Unidades"
                                    value={price.qty_per_price === null ? "" : String(price.qty_per_price)}
                                    disabled={disabled}
                                    onChange={(e) => {
                                        const newValue = e.target.value === "" ? null : Number(e.target.value);
                                        markAndSet(updatePriceField(value, price.price_id!, "qty_per_price", newValue));
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
                                            markAndSet(updatePriceField(value, price.price_id!, "observations", e.target.value));
                                        }}
                                    />
                                    <button
                                        className="absolute top-1 right-1"
                                        onClick={() => {
                                            setShowObservations((prev) => ({ ...prev, [key]: false }));
                                            const next = updatePriceField(value, price.price_id!, "observations", "");
                                            valueRef.current = next;
                                            hasPendingRef.current = false;
                                            onChange(next);
                                            saveImmediate(next);
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
                                            markAndSet(updatePriceField(value, price.price_id!, "valid_until", e.target.value));
                                        }}
                                        className="border border-gray-300 rounded px-2 py-1"
                                    />
                                </div>
                            )}

                            {isSpecial && !price.is_new && (
                                <div className="flex flex-wrap gap-1 items-center mt-1">
                                    {enabledClients.length === 0 ? (
                                        <Badge variant="secondary" className="text-xs">Todos los clientes</Badge>
                                    ) : (
                                        enabledClients.map(({ client_id }) => {
                                            const client = (allClients as Client[]).find((c) => c.client_id === client_id);
                                            return (
                                                <Badge key={client_id} variant="outline" className="text-xs flex gap-1 items-center pr-1">
                                                    {client?.full_name ?? `#${client_id}`}
                                                    <button
                                                        className="ml-0.5 hover:text-red-500"
                                                        disabled={removeClientMutation.isLoading}
                                                        onClick={() => removeClientMutation.mutate({ priceId: price.price_id!, clientId: client_id })}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </Badge>
                                            );
                                        })
                                    )}
                                    {!disabled && availableClients.length > 0 && (
                                        <select
                                            className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white"
                                            onChange={(e) => {
                                                if (!e.target.value) return;
                                                addClientMutation.mutate({ priceId: price.price_id!, clientId: Number(e.target.value) });
                                                e.target.value = "";
                                            }}
                                        >
                                            <option value="">+ Cliente</option>
                                            {availableClients.map((c) => (
                                                <option key={c.client_id} value={c.client_id}>{c.full_name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
                <Button
                    variant="outline"
                    disabled={disabled || addPriceMutation.isLoading}
                    onClick={() => {
                        const maxQty = value
                            .filter((p) => p.logic_type === logic_type)
                            .reduce((max, p) => Math.max(max, p.qty_per_price ?? 0), 0);
                        const newPrice: Price = {
                            price_id: Math.random(),
                            is_new: true,
                            product_presentation_id: productPresentationId,
                            location_id: null,
                            price_number: value.length + 1,
                            price: 0,
                            qty_per_price: maxQty + 1,
                            profit_percentage: 0,
                            logic_type,
                            observations: null,
                            is_active: true,
                            valid_from: null,
                            valid_until: null,
                        };
                        onChange([...value, newPrice]);
                        addPriceMutation.mutate(newPrice);
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

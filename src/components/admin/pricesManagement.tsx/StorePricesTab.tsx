import { pricesAdapter } from '@/adapters/prices';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { getClients } from '@/service/clients';
import { addClientToPrice, createPrices, disablePrice, enablePrice, removeClientFromPrice } from '@/service/prices';
import type { Client } from '@/types/clients';
import type { Location } from '@/types/locations';
import type { DisabledPrice, Price, PriceLogicType } from '@/types/prices';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Percent, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

const StorePricesTab = ({
    productPresentationId, store, finalCost,
    disabled, localPrices, universalPrices, disabledPrices
}: {
    productPresentationId: number;
    store: Location;
    finalCost: {
        final_cost_total: number | null;
        final_cost_per_unit: number | null;
        final_cost_per_bulk: number | null;
    };
    disabled?: boolean;
    localPrices: Price[];
    universalPrices: Price[];
    disabledPrices: DisabledPrice[];
}) => {
    const locationId = store.location_id;
    const queryClient = useQueryClient();

    const [value, onChange] = useState<Price[]>(localPrices);
    const [showObservations, setShowObservations] = useState<Record<string, boolean>>({});

    const valueRef = useRef<Price[]>(localPrices);
    const hasPendingRef = useRef(false);

    // Sync with server data only when there are no pending local edits
    useEffect(() => {
        if (!hasPendingRef.current) onChange(localPrices);
    }, [localPrices]);

    // Save on unmount (safety net for sheet close)
    useEffect(() => {
        return () => {
            if (hasPendingRef.current) {
                createPrices(pricesAdapter(valueRef.current, locationId), []);
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
            return await createPrices(pricesAdapter([newPrice], locationId), []);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["prices", productPresentationId, locationId] });
        },
        onError: (error: { message: string }) => {
            toast.error(error.message || "Error al agregar precio");
        },
    });

    const saveImmediate = (prices: Price[], toDelete: number[] = []) => {
        saveMutation.mutate({ prices: pricesAdapter(prices, locationId), toDelete });
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

    // Mutación: deshabilitar precio universal para este local
    const disableMutation = useMutation({
        mutationFn: ({ priceId }: { priceId: number }) => disablePrice(priceId, locationId),
        onSuccess: () => {
            toast.success("Precio deshabilitado para este local");
            queryClient.invalidateQueries({ queryKey: ["disabled_prices", productPresentationId, locationId] });
        },
        onError: (error: { message: string }) => {
            toast.error(error.message || "Error al deshabilitar precio");
        },
    });

    // Mutación: re-habilitar precio universal para este local
    const enableMutation = useMutation({
        mutationFn: ({ priceId }: { priceId: number }) => enablePrice(priceId, locationId),
        onSuccess: () => {
            toast.success("Precio habilitado para este local");
            queryClient.invalidateQueries({ queryKey: ["disabled_prices", productPresentationId, locationId] });
        },
        onError: (error: { message: string }) => {
            toast.error(error.message || "Error al habilitar precio");
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

    function renderCategory(logic_type: PriceLogicType) {
        const disabledPriceIds = new Set(disabledPrices.map((d) => d.price_id));
        const isLimitedOffer = logic_type === "LIMITED_OFFER";
        const isSpecial = logic_type === "SPECIAL";

        const activeUniversal = universalPrices
            .filter((p) => p.logic_type === logic_type && !disabledPriceIds.has(p.price_id!))
            .sort((a, b) => (a.qty_per_price ?? 0) - (b.qty_per_price ?? 0));

        const activeLocal = value
            .filter((p) => p.logic_type === logic_type)
            .sort((a, b) => (a.qty_per_price ?? 0) - (b.qty_per_price ?? 0));

        const disabledUniversal = universalPrices
            .filter((p) => p.logic_type === logic_type && disabledPriceIds.has(p.price_id!))
            .sort((a, b) => (a.qty_per_price ?? 0) - (b.qty_per_price ?? 0));

        return (
            <div className="space-y-2">

                {/* Universales activos (read-only) */}
                {activeUniversal.map((price) => (
                    <div key={`u-${price.price_id}`} className="flex flex-col gap-1">
                        <Badge className="w-fit text-xs bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
                            Universal
                        </Badge>
                        <div className="grid grid-cols-[1fr_1fr_1fr_40px] gap-2 items-center">
                            {finalCost?.final_cost_total && (
                                <div className="relative">
                                    <Percent className="absolute w-3 h-3 left-2 top-1/2 -translate-y-1/2 opacity-40" />
                                    <Input className="pl-5" value={price.profit_percentage} disabled />
                                </div>
                            )}
                            <div className="relative">
                                <DollarSign className="absolute w-3 h-3 left-2 top-1/2 -translate-y-1/2 opacity-40" />
                                <Input className="pl-5" value={price.price} disabled />
                            </div>
                            <Input value={price.qty_per_price} disabled />
                            <Button
                                variant="ghost"
                                size="icon"
                                title="Deshabilitar para este local"
                                disabled={disableMutation.isLoading}
                                onClick={() => disableMutation.mutate({ priceId: price.price_id! })}
                            >
                                <X className="w-4 h-4 text-muted-foreground" />
                            </Button>
                        </div>
                        {isSpecial && (
                            <div className="flex flex-wrap gap-1 items-center">
                                {(price.enabled_prices_clients ?? []).length === 0 ? (
                                    <Badge variant="secondary" className="text-xs">Todos los clientes</Badge>
                                ) : (
                                    (price.enabled_prices_clients ?? []).map(({ client_id }) => {
                                        const client = (allClients as Client[]).find((c) => c.client_id === client_id);
                                        return (
                                            <Badge key={client_id} variant="outline" className="text-xs">
                                                {client?.full_name ?? `#${client_id}`}
                                            </Badge>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {/* Locales activos (editables) */}
                {activeLocal.map((price, index) => {
                    const key = String(price.price_id ?? `new-${index}`);
                    const isVisible = showObservations[key] ?? false;
                    const enabledClients = price.enabled_prices_clients ?? [];
                    const availableClients = (allClients as Client[]).filter(
                        (c) => !enabledClients.some((ec) => ec.client_id === c.client_id)
                    );

                    return (
                        <div key={`l-${key}`} className="flex flex-col gap-1" onBlur={saveOnRowBlur}>
                            <Badge className="w-fit text-xs bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                                Local
                            </Badge>
                            <div className="grid grid-cols-[1fr_1fr_1fr_40px] gap-2 items-center">
                                {finalCost?.final_cost_total && (
                                    <div className="relative">
                                        <Percent className="absolute w-3 h-3 left-2 top-1/2 -translate-y-1/2 opacity-50" />
                                        <Input
                                            type="number"
                                            placeholder="Ganancia %"
                                            className="pl-5"
                                            value={price.profit_percentage}
                                            disabled={disabled}
                                            onChange={(e) => {
                                                markAndSet(updatePriceField(value, price.price_id!, "profit_percentage", e.target.value));
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
                                            markAndSet(updatePriceField(value, price.price_id!, "price", e.target.value));
                                        }}
                                    />
                                </div>
                                <Input
                                    placeholder="Unidades"
                                    value={price.qty_per_price}
                                    disabled={disabled}
                                    onChange={(e) => {
                                        markAndSet(updatePriceField(value, price.price_id!, "qty_per_price", e.target.value));
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

                {/* Botón agregar precio local */}
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
                            location_id: locationId,
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

                {/* Universales deshabilitados */}
                {disabledUniversal.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-t-gray-300 space-y-2">
                        {disabledUniversal.map((price) => (
                            <div key={`d-${price.price_id}`} className="flex flex-col gap-1">
                                <Badge variant="destructive" className="w-fit text-xs">
                                    Deshabilitado
                                </Badge>
                                <div className="grid grid-cols-[1fr_1fr_1fr_40px] gap-2 items-center opacity-70">
                                    {finalCost?.final_cost_total && (
                                        <div className="relative">
                                            <Percent className="absolute w-3 h-3 left-2 top-1/2 -translate-y-1/2 opacity-50" />
                                            <Input className="pl-5" value={price.profit_percentage} disabled />
                                        </div>
                                    )}
                                    <div className="relative">
                                        <DollarSign className="absolute w-3 h-3 left-2 top-1/2 -translate-y-1/2 opacity-50" />
                                        <Input className="pl-5" value={price.price} disabled />
                                    </div>
                                    <Input value={price.qty_per_price} disabled />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Habilitar para este local"
                                        disabled={enableMutation.isLoading}
                                        onClick={() => enableMutation.mutate({ priceId: price.price_id! })}
                                    >
                                        <RotateCcw className="w-4 h-4 text-green-600" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <TabsContent value={store.location_id.toString()}>
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <h3 className="font-semibold mb-2">Por cantidad</h3>
                    {renderCategory("QUANTITY_DISCOUNT")}
                </div>
                <div>
                    <h3 className="font-semibold mb-2">Especial</h3>
                    {renderCategory("SPECIAL")}
                </div>
                <div>
                    <h3 className="font-semibold mb-2">Oferta</h3>
                    {renderCategory("LIMITED_OFFER")}
                </div>
            </div>
        </TabsContent>
    );
};

export default StorePricesTab;

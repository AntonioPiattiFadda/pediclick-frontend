import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPricesByLot } from "@/service/prices";
import type { Price } from "@/types/prices";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";

interface PricesSelectorProps {
  value: Price[];
  onChange: (prices: Price[]) => void;
  disabled: boolean;
  lotId: number;
  basePrice: number;
}

export function PricesSelectorV2({
  value,
  onChange,
  disabled,
  lotId,
  basePrice = 100,
}: PricesSelectorProps) {
  const minorQuantityDiscountPrices = value.filter(
    (price) =>
      price.logic_type === "QUANTITY_DISCOUNT" && price.price_type === "MINOR"
  );

  //   const minorSpecialPrices = value.filter(
  //     (price) => price.logic_type === "SPECIAL" && price.price_type === "MINOR"
  //   );

  //   const minorLimitedOfferPrices = value.filter(
  //     (price) =>
  //       price.logic_type === "LIMITED_OFFER" && price.price_type === "MINOR"
  //   );

  const { isLoading: isLoading } = useQuery({
    queryKey: ["prices", lotId],
    queryFn: async () => {
      const response = await getPricesByLot(lotId);
      return response.prices;
    },
    enabled: !!lotId,
  });

  if (isLoading && lotId) {
    return <Input placeholder="Buscando precios del lote..." disabled />;
  }

  // === Constante base por unidad ===

  // === Helpers ===
  const toNumber = (v: string | number) => {
    const n = typeof v === "number" ? v : parseFloat(v.replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  };
  const round2 = (n: number) => Math.round(n * 100) / 100;

  const ensureUnits = (u?: number) => (u && u > 0 ? u : 1);

  // Recalcular desde porcentaje
  function recalcFromPercentage(row: Price): Price {
    const units = ensureUnits(row.units_per_price);
    const pct = row.profit_percentage ?? 0;
    const perUnit = basePrice * (1 + pct / 100);
    const unit_price = round2(perUnit * units);
    return { ...row, units_per_price: units, unit_price };
  }

  // Recalcular desde unit_price
  function recalcFromUnitPrice(row: Price): Price {
    const units = ensureUnits(row.units_per_price);
    const perUnit = row.unit_price / units;
    const profit_percentage = round2((perUnit / basePrice - 1) * 100);
    return { ...row, units_per_price: units, profit_percentage };
  }

  // Recalcular desde units_per_price
  function recalcFromUnits(row: Price, prevUnits?: number): Price {
    const units = ensureUnits(row.units_per_price);

    // Si tenemos % definido, usamos eso como fuente de verdad
    if (Number.isFinite(row.profit_percentage)) {
      const pct = row.profit_percentage ?? 0;
      const perUnit = basePrice * (1 + pct / 100);
      const unit_price = round2(perUnit * units);
      return { ...row, units_per_price: units, unit_price };
    }

    // Si no hay %, preservamos el precio por unidad previo y ajustamos total
    const oldUnits = ensureUnits(prevUnits);
    const prevPerUnit = row.unit_price / oldUnits;
    const unit_price = round2(prevPerUnit * units);
    const profit_percentage = round2((prevPerUnit / basePrice - 1) * 100);
    return { ...row, units_per_price: units, unit_price, profit_percentage };
  }

  // === Updater genérico para tu array de precios ===
  type UpdateField = "profit_percentage" | "unit_price" | "units_per_price";

  function updatePriceField(
    prices: Price[],
    priceId: number,
    field: UpdateField,
    value: string | number
  ): Price[] {
    return prices.map((row) => {
      if (row.price_id !== priceId) return row;

      const prevUnits = row.units_per_price;
      let next: Price = { ...row };

      if (field === "profit_percentage") {
        const pct = toNumber(value);
        next.profit_percentage = Number.isFinite(pct) ? pct : 0;
        // Si no hay units definidos, usar 1
        next.units_per_price = ensureUnits(next.units_per_price);
        next = recalcFromPercentage(next);
      }

      if (field === "unit_price") {
        const up = toNumber(value);
        next.unit_price = Number.isFinite(up) ? up : 0;
        // Si no hay units definidos, usar 1
        next.units_per_price = ensureUnits(next.units_per_price);
        next = recalcFromUnitPrice(next);
      }

      if (field === "units_per_price") {
        const units = toNumber(value);
        next.units_per_price = Number.isFinite(units) ? Math.max(1, units) : 1;
        next = recalcFromUnits(next, prevUnits);
      }

      return next;
    });
  }

  return (
    <div className="flex items-center gap-2 w-full ">
      <Tabs defaultValue="MINOR" className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="MINOR">
            Por Menor{" "}
            {minorQuantityDiscountPrices.sort(
              (a, b) => a.price_number - b.price_number
            )[0]?.unit_price || "..."}{" "}
          </TabsTrigger>
          <TabsTrigger value="MAYOR">Por Mayor </TabsTrigger>
        </TabsList>

        <TabsContent className="" value="MINOR">
          <div>
            <h3 className="font-medium">Logica por cantidad</h3>
            {minorQuantityDiscountPrices.map((price) => {
              const isFirstPrice = price.price_number === 1;
              return (
                <div
                  className="grid grid-cols-[1fr_1fr_1fr_50px] gap-2"
                  key={price.price_id}
                >
                  <span>
                    <div className="flex gap-2 items-center">
                      Ganancia
                      <Input
                        placeholder="Ganancia %"
                        value={price.profit_percentage}
                        disabled={disabled}
                        onChange={(e) =>
                          onChange(
                            updatePriceField(
                              value,
                              price.price_id!,
                              "profit_percentage",
                              e.target.value
                            )
                          )
                        }
                      />
                    </div>
                  </span>

                  <div className="flex gap-2 items-center">
                    Precio:
                    <Input
                      placeholder="Precio total"
                      value={price.unit_price}
                      disabled={disabled}
                      onChange={(e) =>
                        onChange(
                          updatePriceField(
                            value,
                            price.price_id!,
                            "unit_price",
                            e.target.value
                          )
                        )
                      }
                    />
                  </div>

                  <div className="flex gap-2 items-center">
                    {isFirstPrice ? "=" : "desde"}{" "}
                    <Input
                      placeholder="units_per_price"
                      value={price.units_per_price}
                      disabled={disabled}
                      onChange={(e) =>
                        onChange(
                          updatePriceField(
                            value,
                            price.price_id!,
                            "units_per_price",
                            e.target.value
                          )
                        )
                      }
                    />
                  </div>

                  {!isFirstPrice && (
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={disabled}
                      onClick={() => {
                        onChange(
                          value.filter(
                            (p: Price) => p.price_id !== price.price_id
                          )
                        );
                      }}
                      aria-label="Eliminar precio"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              disabled={disabled}
              className="mt-2 w-full border border-dashed rounded-xl py-2 flex items-center justify-center gap-2 hover:bg-muted/40 transition-colors"
              onClick={() => {
                const newPrice: Price = {
                  price_id: Math.random(), // or use a proper id generator
                  price_number: value.length + 1,
                  profit_percentage: 0,
                  logic_type: "QUANTITY_DISCOUNT",
                  price_type: "MINOR",
                  observations: null,
                  is_limited_offer: false,
                  is_active: true,
                  valid_from: null,
                  valid_until: null,
                  lot_id: lotId || null,
                  units_per_price: 1,
                  unit_price: round2(basePrice * 1),
                };
                onChange([...value, newPrice]);
              }}
              aria-label="Agregar precio"
            >
              <Plus className="h-2 w-2" />
              <span>Agregar precio</span>
            </button>
          </div>
        </TabsContent>
        <TabsContent value="MAYOR"></TabsContent>
      </Tabs>
    </div>
  );
}

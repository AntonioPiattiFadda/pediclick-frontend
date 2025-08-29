/* eslint-disable @typescript-eslint/no-explicit-any */
import { Input } from "@/components/ui/input";
import { Copy, Trash2 } from "lucide-react";
import { useState } from "react";
// Este es el type

//   price: Number(price.price) || 0,
//   type: price.type,
//   quantity: Number(price.quantity) || 0,
//   discount_percent: price.discount_percent
//     ? Number(price.discount_percent)
//     : 0,

const CopyPriceSelector = ({
  selectedLotIndex,
  setSelectedLotIndex,
  lots,
  currentLotIndex,
  copyPricesFromLot,
}: {
  selectedLotIndex: any;
  setSelectedLotIndex: (index: number) => void;
  lots: any[];
  currentLotIndex: number;
  copyPricesFromLot: () => void;
}) => {

  const lotsWithControl = lots.filter((lot) => lot.lot_control);

  return (
    <div className=" absolute right-4 top-2 rounded-lg p-1 bg-gray-50">
      <div className="flex items-center gap-2">
        <select
          value={selectedLotIndex}
          onChange={(e) => setSelectedLotIndex(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
        >
          <option value="">Seleccionar lote...</option>
          {lotsWithControl.map((lot, index) => (
            <option
              key={index}
              value={index}
              disabled={index === currentLotIndex}
            >
              {lot.lot}
              {lot.lot_number ? ` - ${lot.lot_number}` : ""}
              {index === currentLotIndex ? " (Actual)" : ""}
              {!lot.prices || lot.prices.length === 0 ? " (Sin precios)" : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={copyPricesFromLot}
          disabled={
            selectedLotIndex === "" ||
            selectedLotIndex === currentLotIndex.toString() ||
            !lots[parseInt(selectedLotIndex)]?.prices?.length
          }
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
        >
          <Copy className="w-4 h-4" />
          Copiar Precios
        </button>
      </div>
    </div>
  );
};

const PricesSelector = ({
  prices,
  setPrices,
  saleUnits,
  selectedUnitId,
  lots,
  currentLotIndex,
  lotControl,
}: {
  prices: any;
  setPrices: (data: any) => void;
  saleUnits: any[];
  selectedUnitId: any;
  lots: any[];
  currentLotIndex: number;

  lotControl: boolean;
}) => {
  const assignType = (price: any, index: number): string => {
    if (index === 0) return "PRIMARY";
    if (price.is_separate) return "SPECIAL";
    return "PROMO";
  };

  // 🔹 Asegurar que todos los precios tengan un type correcto
  const normalizePrices = (prices: any[]) =>
    prices.map((p, i) => ({ ...p, type: assignType(p, i) }));

  // Obtener el precio base unitario y la cantidad base
  const getBaseData = () => {
    const basePrice = parseFloat(prices?.[0]?.price) || 0;
    const baseQuantity = parseFloat(prices?.[0]?.quantity) || 1;
    return { basePrice, baseQuantity };
  };

  // Calcular precio total esperado para una cantidad específica
  const calculateExpectedTotal = (quantity: number): number => {
    const { basePrice, baseQuantity } = getBaseData();
    if (basePrice === 0 || baseQuantity === 0) return 0;

    const pricePerUnit = basePrice / baseQuantity;
    return pricePerUnit * quantity;
  };

  // Calcular el precio con descuento sobre el total esperado
  const calculateDiscountedPrice = (
    expectedTotal: number,
    discountPercent: number
  ): number => {
    return expectedTotal * (1 - discountPercent / 100);
  };

  // Calcular el porcentaje de descuento comparando con el total esperado
  const calculateDiscountPercent = (
    expectedTotal: number,
    finalPrice: number
  ): number => {
    if (expectedTotal === 0) return 0;
    return ((expectedTotal - finalPrice) / expectedTotal) * 100;
  };

  // Manejar cambio en porcentaje de descuento
  const handleDiscountPercentChange = (index: number, percent: string) => {
    const updated = [...prices];
    const percentValue = parseFloat(percent) || 0;
    const quantity = parseFloat(updated[index].quantity) || 0;
    const expectedTotal = calculateExpectedTotal(quantity);

    updated[index].discount_percent = percent;
    updated[index].price =
      expectedTotal > 0
        ? calculateDiscountedPrice(expectedTotal, percentValue).toFixed(2)
        : "";

    setPrices(normalizePrices(updated));
  };

  // Manejar cambio en precio final
  const handlePromoPriceChange = (index: number, price: string) => {
    const updated = [...prices];
    const priceValue = parseFloat(price) || 0;
    const quantity = parseFloat(updated[index].quantity) || 0;
    const expectedTotal = calculateExpectedTotal(quantity);

    updated[index].price = price;
    updated[index].discount_percent =
      expectedTotal > 0
        ? calculateDiscountPercent(expectedTotal, priceValue).toFixed(1)
        : "0";

    setPrices(normalizePrices(updated));
  };

  // Manejar cambio en cantidad (recalcular precio y descuento)
  const handleQuantityChange = (index: number, quantity: string) => {
    const updated = [...prices];
    const quantityValue = parseFloat(quantity) || 0;

    updated[index].quantity = quantity;

    if (index > 0 && !updated[index].is_separate) {
      const discountPercent = parseFloat(updated[index].discount_percent) || 0;
      const expectedTotal = calculateExpectedTotal(quantityValue);

      updated[index].price =
        expectedTotal > 0 && discountPercent > 0
          ? calculateDiscountedPrice(expectedTotal, discountPercent).toFixed(2)
          : expectedTotal.toFixed(2);
    }

    setPrices(normalizePrices(updated));
  };

  // Obtener información de precio para mostrar
  // const getPriceInfo = (index: number) => {
  //   const price = prices[index];
  //   const quantity = parseFloat(price.quantity) || 0;
  //   const expectedTotal = calculateExpectedTotal(quantity);
  //   const actualPrice = parseFloat(price.price) || 0;
  //   const savings = expectedTotal - actualPrice;

  //   return {
  //     expectedTotal,
  //     actualPrice,
  //     savings: savings > 0 ? savings : 0,
  //     quantity
  //   };
  // };

  const getSelectedUnit = () => {
    if (!selectedUnitId) return "N/A";
    const selectedUnit = saleUnits?.find((unit) => {
      return unit.sale_unit_id === Number(selectedUnitId);
    });
    return selectedUnit?.sale_unit_name || "N/A";
  };

  const { basePrice } = getBaseData();

  const handleRemovePrice = (index: number) => {
    const updatedPrices = [...prices];
    updatedPrices.splice(index, 1);
    setPrices(updatedPrices);
  };

  const [selectedLotIndex, setSelectedLotIndex] = useState<string>("");

  const copyPricesFromLot = () => {
    if (
      selectedLotIndex === "" ||
      selectedLotIndex === currentLotIndex.toString()
    ) {
      return;
    }

    const sourceLotIndex = parseInt(selectedLotIndex);
    const sourceLot = lots[sourceLotIndex];

    if (sourceLot && sourceLot.prices && sourceLot.prices.length > 0) {
      // Crear una copia profunda de los precios del lote origen
      const copiedPrices = sourceLot.prices.map((price: any) => ({
        ...price,
        price: price.price || "",
        quantity: price.quantity || "",
        discount_percent: price.discount_percent || "",
        type: price.type || "PRIMARY",
        is_separate: price.is_separate || false,
      }));

      setPrices(copiedPrices);
      setSelectedLotIndex(""); // Reset del select después de copiar
    }
  };

  return (
    <div className="space-y-6 mt-2">
      {/* Sección 1: Precios Convencionales y Promocionales */}
      <div className="border rounded-lg p-4 pt-6 relative">
        {lotControl && (
          <CopyPriceSelector
            selectedLotIndex={selectedLotIndex}
            setSelectedLotIndex={setSelectedLotIndex}
            lots={lots}
            currentLotIndex={currentLotIndex}
            copyPricesFromLot={copyPricesFromLot}
          />
        )}
        <h3 className="text-lg font-semibold mb-4">Precios Convencionales</h3>

        <div className="space-y-3">
          {prices?.map((price: any, index: number) => (
            <div key={index}>
              {index === 0 ? (
                <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg">
                  <span className="text-sm font-medium text-blue-700 min-w-[80px]">
                    Precio Base:
                  </span>
                  <Input
                    type="number"
                    placeholder="Cantidad"
                    value={price.quantity}
                    onChange={(e) =>
                      handleQuantityChange(index, e.target.value)
                    }
                    className="w-24"
                  />
                  <span className="text-sm text-gray-600 min-w-[40px]">
                    {getSelectedUnit()}
                  </span>
                  <span className="text-gray-500">→</span>
                  <span className="text-sm text-gray-600">$</span>
                  <Input
                    type="number"
                    placeholder="Precio total"
                    value={price.price}
                    onChange={(e) => {
                      const updated = [...prices];
                      updated[index].price = e.target.value;

                      for (let i = 1; i < updated.length; i++) {
                        if (
                          updated[i].discount_percent &&
                          !updated[i].is_separate
                        ) {
                          const quantity = parseFloat(updated[i].quantity) || 0;
                          const discount =
                            parseFloat(updated[i].discount_percent) || 0;
                          const expectedTotal =
                            calculateExpectedTotal(quantity);
                          updated[i].price =
                            expectedTotal > 0
                              ? calculateDiscountedPrice(
                                  expectedTotal,
                                  discount
                                ).toFixed(2)
                              : "";
                        }
                      }
                      setPrices(normalizePrices(updated));
                    }}
                    className="flex-1"
                  />
                </div>
              ) : price.type === "PROMO" ? (
                // Precios promocionales (PROMO)
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg">
                    <span className="text-sm font-medium text-green-700 min-w-[80px]">
                      Promoción:
                    </span>
                    <Input
                      type="number"
                      placeholder="Cantidad"
                      value={price.quantity}
                      onChange={(e) =>
                        handleQuantityChange(index, e.target.value)
                      }
                      className="w-24"
                    />
                    <span className="text-sm text-gray-600 min-w-[40px]">
                      {getSelectedUnit()}
                    </span>
                    <span className="text-gray-500">→</span>

                    <Input
                      type="number"
                      placeholder="% Desc."
                      value={price.discount_percent || ""}
                      onChange={(e) =>
                        handleDiscountPercentChange(index, e.target.value)
                      }
                      className="w-20"
                      min="0"
                      max="100"
                    />
                    <span className="text-sm text-gray-600">%</span>

                    <span className="text-gray-500">→</span>

                    <span className="text-sm text-gray-600">$</span>
                    <Input
                      type="number"
                      placeholder="Precio final"
                      value={price.price}
                      onChange={(e) =>
                        handlePromoPriceChange(index, e.target.value)
                      }
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePrice(index)}
                      className=""
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            setPrices(
              normalizePrices([
                ...prices,
                {
                  quantity: "",
                  price: "",
                  discount_percent: "",
                  is_separate: false,
                },
              ])
            )
          }
          className="text-green-600 hover:text-green-800 font-semibold text-sm mt-3"
          disabled={basePrice === 0}
        >
          + Agregar precio promocional
        </button>
      </div>

      {/* Sección 2: Precios Separados */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Precios Especiales</h3>
        <p className="text-sm text-gray-600 mb-4">
          Para casos particulares que no siguen la estructura de descuentos
        </p>

        <div className="space-y-3">
          {prices
            ?.filter((price: any) => price.type === "SPECIAL")
            .map((price: any) => {
              const index = prices.findIndex((p: any) => p === price);
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-orange-50 p-3 rounded-lg"
                >
                  <span className="text-sm font-medium text-orange-700 min-w-[80px]">
                    Especial:
                  </span>
                  <Input
                    type="number"
                    placeholder="Cantidad"
                    value={price.quantity}
                    onChange={(e) => {
                      const updated = [...prices];
                      updated[index].quantity = e.target.value;
                      setPrices(normalizePrices(updated));
                    }}
                    className="w-24"
                  />
                  <span className="text-sm text-gray-600 min-w-[40px]">
                    {getSelectedUnit()}
                  </span>
                  <span className="text-gray-500">→</span>
                  <span className="text-sm text-gray-600">$</span>
                  <Input
                    type="number"
                    placeholder="Precio"
                    value={price.price}
                    onChange={(e) => {
                      const updated = [...prices];
                      updated[index].price = e.target.value;
                      setPrices(normalizePrices(updated));
                    }}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePrice(index)}
                    className=""
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              );
            })}
        </div>

        <button
          type="button"
          onClick={() =>
            setPrices(
              normalizePrices([
                ...prices,
                { quantity: "", price: "", is_separate: true },
              ])
            )
          }
          className="text-orange-600 hover:text-orange-800 font-semibold text-sm mt-3"
        >
          + Agregar precio separado
        </button>
      </div>
    </div>
  );
};

export default PricesSelector;

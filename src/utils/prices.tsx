export const pricesTypeAndLogicOptions = {
    price_type: [
        { value: "MINOR", label: "Minorista" },
        { value: "MAYOR", label: "Mayorista" },
    ],
    logic_type: [
        { value: "QUANTITY_DISCOUNT", label: "Descuento por cantidad" },
        { value: "SPECIAL", label: "Especial" },
        { value: "LIMITED_OFFER", label: "Oferta limitada" },
    ],
};

export const formatCurrency = (
    value: number,
    locale: string = 'es-AR',
    currency: string = 'ARS'
): string => {
    return (value).toLocaleString(locale, {
        style: 'currency',
        currency,
    });
};


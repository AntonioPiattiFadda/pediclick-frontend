import { Button } from "../../ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { Price, PriceLogicType, PriceType } from "@/types/prices";
import { getPreviousPrice } from "@/service/prices";

const GetPreviousPrices = ({
    onClick,
    priceType,
    logicType,
    productId,
    storeId
}: {
    onClick: (previousPrice: Price[]) => void;
    priceType: PriceType;
    logicType: PriceLogicType;
    productId: number;
    storeId: number | null;
}) => {
    const [loading, setLoading] = useState(false);

    const handleGetPreviousPrice = async () => {
        // Lógica para obtener el precio anterior
        try {
            setLoading(true);
            const previousPrice = await getPreviousPrice(productId, priceType, logicType, storeId === null ? undefined : storeId);
            onClick(previousPrice);
            setLoading(false);
        } catch (error) {
            console.error("Error al obtener el siguiente número de LoadOrdere:", error);
            setLoading(false);
        }
    }

    return (
        <Button onClick={handleGetPreviousPrice} disabled={loading} className="flex items-center">
            {loading ? <Loader2 className=" h-4 w-4 animate-spin" /> : "Auto"}
        </Button>
    )
}

export default GetPreviousPrices
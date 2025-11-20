import { getFollowingLotNumber } from "@/service/lots";
import { Button } from "../ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const GetFollowingLotNumberBtn = ({
    onClick,
    productId
}: {
    onClick: (nextLotNumber: number) => void;
    productId: number;
}) => {
    const [loading, setLoading] = useState(false);
    const handleGetFollowingLotNumber = async () => {
        // Lógica para obtener el siguiente número de lote
        try {
            setLoading(true);
            const nextLotNumber = await getFollowingLotNumber(productId);
            onClick(nextLotNumber);
            setLoading(false);
        } catch (error) {
            console.error("Error al obtener el siguiente número de lote:", error);
            setLoading(false);
        }
    }

    return (
        <Button onClick={handleGetFollowingLotNumber} disabled={loading} className="flex items-center">
            {loading ? <Loader2 className=" h-4 w-4 animate-spin" /> : "Auto"}
        </Button>
    )
}

export default GetFollowingLotNumberBtn
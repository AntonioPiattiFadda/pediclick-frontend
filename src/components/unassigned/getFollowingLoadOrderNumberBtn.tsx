import { Button } from "../ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAppSelector } from "@/hooks/useUserData";
import { getFollowingLoadOrderNumber } from "@/service/loadOrders";

const GetFollowingLoadOrderNumberBtn = ({
    onClick
}: {
    onClick: (nextLotNumber: number) => void;
}) => {
    const [loading, setLoading] = useState(false);

    const { role } = useAppSelector(state => state.user);
    const handleGetFollowingLoadOrderNumber = async () => {
        // Lógica para obtener el siguiente número de LoadOrdere
        try {
            setLoading(true);
            const nextLoadOrderNumber = await getFollowingLoadOrderNumber(role);
            onClick(nextLoadOrderNumber);
            setLoading(false);
        } catch (error) {
            console.error("Error al obtener el siguiente número de LoadOrdere:", error);
            setLoading(false);
        }
    }

    return (
        <Button onClick={handleGetFollowingLoadOrderNumber} disabled={loading} className="flex items-center">
            {loading ? <Loader2 className=" h-4 w-4 animate-spin" /> : "Auto"}
        </Button>
    )
}

export default GetFollowingLoadOrderNumberBtn
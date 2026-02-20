import { Button } from "@/components/ui/button";
import { closeLot } from "@/service/lots";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface CloseLotDialogProps {
    lotId: number | null;
    onClose?: () => void;
}

const CloseLotDialog = ({ lotId, onClose }: CloseLotDialogProps) => {
    const queryClient = useQueryClient();
    const [confirmClose, setConfirmClose] = useState(false);

    const closeLotMutation = useMutation({
        mutationFn: async (id: number) => {
            return await closeLot(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lot-sales-history", lotId] });
            queryClient.invalidateQueries({ queryKey: ["lot-all-sales", lotId] });
            queryClient.invalidateQueries({ queryKey: ["lot-performance", lotId] });
            queryClient.invalidateQueries({ queryKey: ["sold-stock-products"] });



            setConfirmClose(false);
            toast.success("Lote cerrado exitosamente");
            onClose?.();
        },
        onError: (error: Error) => {
            setConfirmClose(false);
            toast.error(error.message || "Error al cerrar el lote");
        },
    });

    const handleCloseLot = async () => {
        if (!lotId) return;

        if (!confirmClose) {
            setConfirmClose(true);
            return;
        }

        try {
            await closeLotMutation.mutateAsync(lotId);
        } catch (error) {
            console.error("Error closing lot:", error);
        }
    };

    return (
        <Button
            variant={confirmClose ? "destructive" : "outline"}
            size="sm"
            disabled={!lotId || closeLotMutation.isLoading}
            onClick={handleCloseLot}
            onBlur={() => setConfirmClose(false)}
        >
            <Lock className="w-4 h-4 mr-2" />
            {closeLotMutation.isLoading
                ? "Cerrando..."
                : confirmClose
                    ? "Confirmar"
                    : "Cerrar lote"}
        </Button>
    );
};

export default CloseLotDialog;
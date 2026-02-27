import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { correctStockOversell } from "@/service/stock";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export function OverSellPopover({ stocks, lotId }: { stocks: any[]; lotId: number }) {
    const queryClient = useQueryClient();
    const totalOverSell = stocks.reduce((acc, s) => acc + s.over_sell_quantity, 0);

    const correctMutation = useMutation({
        mutationFn: (stockId: number) => correctStockOversell(stockId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lot-stocks", lotId] });
            toast.success("Sobreventa corregida");
        },
        onError: (error: Error) => {
            toast.error("Error al corregir sobreventa: " + error.message);
        },
    });

    if (stocks.length === 0) return null;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 shrink-0"
                >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Sobreventa
                    <Badge className="h-4 px-1.5 text-[10px] bg-orange-200 text-orange-800 border-0 hover:bg-orange-200">
                        {totalOverSell}
                    </Badge>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        Sobreventa por ubicación
                    </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground -mt-2">
                    Unidades vendidas por encima del stock disponible
                </p>
                <div className="flex flex-col gap-2 mt-2">
                    {stocks.map((s) => {
                        const locationName =
                            s.store_name ?? s.stock_room_name ?? `Ubicación #${s.location_id}`;
                        const isLoading =
                            correctMutation.isLoading && correctMutation.variables === s.stock_id;
                        return (
                            <div
                                key={s.stock_id}
                                className="flex items-center justify-between gap-3 rounded-md border border-orange-100 bg-orange-50/50 px-3 py-2"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{locationName}</p>
                                    <p className="text-xs font-semibold text-orange-700">
                                        {s.over_sell_quantity} un. sobrevendidas
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs shrink-0"
                                    disabled={isLoading}
                                    onClick={() => correctMutation.mutate(s.stock_id)}
                                >
                                    {isLoading
                                        ? <Loader2 className="h-3 w-3 animate-spin" />
                                        : "Corregir"
                                    }
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}

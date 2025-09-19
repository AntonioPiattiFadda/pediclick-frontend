/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/hooks/useUserData";
import { createStockRoom, getStockRooms } from "@/service/stockRooms";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface StockRoomSelectProps {
    value: number | null;
    onChange: (id: number | null) => void;
    disabled: boolean;
}

export function StockRoomSelector({
    value,
    onChange,
    disabled,
}: StockRoomSelectProps) {
    const queryClient = useQueryClient();

    const { data: stockRooms, isLoading: isLoading } = useQuery({
        queryKey: ["stock-rooms"],
        queryFn: async () => {
            const response = await getStockRooms(role);
            return response.stockRooms;
        },
    });

    console.log("StockRooms en StockRoomSelector:", stockRooms);

    const [newStockRoom, setNewStockRoom] = useState("");
    const [open, setOpen] = useState(false);

    const { role } = useAppSelector((state) => state.user);

    const createStockRoomMutation = useMutation({
        mutationFn: async (data: { newStockRoom: string }) => {
            return await createStockRoom(data.newStockRoom, role);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["stock-rooms"] });
            onChange(data.stock_room_id);
            setOpen(false);
        },
        onError: (error: any) => {
            const errorMessage = error.message;
            toast("Error al crear sala de stock", {
                description: errorMessage,
            });
        },
    });

    const handleCreateStockRoom = async () => {
        if (!newStockRoom) return;

        try {
            await createStockRoomMutation.mutateAsync({ newStockRoom });
            setNewStockRoom("");
        } catch (error) {
            console.error("Error creating stock room:", error);
        }
    };

    if (isLoading) {
        return <Input placeholder="Buscando tus depositos..." disabled />;
    }

    return (
        <div className="flex items-center gap-2 w-full">
            <select
                className="w-full border rounded px-2 py-2"
                disabled={disabled}
                value={value === null ? "" : value}
                onChange={(e) =>
                    onChange(e.target.value === "" ? 0 : Number(e.target.value))
                }
            >
                <option value={0}>Sin Deposito</option>
                {(stockRooms ?? []).map((cat) => (
                    <option key={cat.stock_room_id} value={cat.stock_room_id}>
                        {cat.stock_room_name}
                    </option>
                ))}
            </select>

            {/* Si hay selección, mostrar tacho */}
            {value && (
                <Button
                    variant="ghost"
                    disabled={disabled}
                    size="icon"
                    onClick={() => onChange(null)}
                    className="text-red-500 hover:text-red-700"
                >
                    <Trash2 className="w-5 h-5" />
                </Button>
            )}

            {/* Botón para crear nueva sala de stock */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button disabled={disabled} variant="outline">
                        + Nuevo
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Crear nueva sala de stock</DialogTitle>
                        <DialogDescription>
                            Ingresá el nombre del nuevo rubro que quieras crear.
                        </DialogDescription>
                    </DialogHeader>

                    <Input
                        value={newStockRoom}
                        disabled={createStockRoomMutation.isLoading}
                        onChange={(e) => setNewStockRoom(e.target.value)}
                        placeholder="Nombre de la sala de stock"
                    />

                    <DialogFooter>
                        <Button
                            disabled={createStockRoomMutation.isLoading}
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            disabled={createStockRoomMutation.isLoading}
                            onClick={handleCreateStockRoom}
                        >
                            {createStockRoomMutation.isLoading ? "Creando..." : "Crear"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

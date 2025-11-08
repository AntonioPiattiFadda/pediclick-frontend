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
import { createStockRoom, getStockRooms } from "@/service/stockRooms";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createContext,
    useContext,
    useState,
    type ReactNode,
} from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";

// ---------- Context ----------
interface StockRoomSelectorContextType {
    value: number | null;
    onChange: (id: number | null) => void;
    disabled: boolean;
    stockRooms: any[];
    isLoading: boolean;
}

const StockRoomSelectorContext =
    createContext<StockRoomSelectorContextType | null>(null);

function useStockRoomSelectorContext() {
    const ctx = useContext(StockRoomSelectorContext);
    if (!ctx)
        throw new Error("StockRoomSelector components must be used inside Root");
    return ctx;
}

// ---------- Root ----------
interface RootProps {
    value: number | null;
    onChange: (id: number | null) => void;
    disabled?: boolean;
    children: ReactNode;
}

const StockroomSelectorRoot = ({ value, onChange, disabled = false, children }: RootProps) => {
    const { data: stockRooms, isLoading } = useQuery({
        queryKey: ["stock-rooms"],
        queryFn: async () => {
            const response = await getStockRooms();
            return response.stockRooms;
        },
    });

    return (
        <StockRoomSelectorContext.Provider
            value={{
                value,
                onChange,
                disabled,
                stockRooms: stockRooms ?? [],
                isLoading,
            }}
        >
            <div className="flex items-center gap-2 w-full">{children}</div>
        </StockRoomSelectorContext.Provider>
    );
};

// ---------- Select ----------
const SelectStockRoom = () => {
    const { value, onChange, disabled, stockRooms, isLoading } =
        useStockRoomSelectorContext();

    if (isLoading) {
        return <Input placeholder="Buscando tus depósitos..." disabled />;
    }

    return (
        <>
            <select
                className={`w-full border border-gray-200 rounded px-2 py-2 ${disabled && "opacity-50 cursor-not-allowed"} text-gray-500`}

                disabled={disabled}
                value={value === null ? "" : value}
                onChange={(e) =>
                    onChange(e.target.value === "" ? null : Number(e.target.value))
                }
            >
                <option disabled value="">Sin Depósito</option>
                {(stockRooms ?? []).map((room) => (
                    <option key={room.stock_room_id} value={room.stock_room_id}>
                        {room.stock_room_name}
                    </option>
                ))}
            </select>

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
        </>
    );
};

// ---------- Create ----------
const CreateStockRoom = ({ isShortCut = false }: {
    isShortCut?: boolean;
}) => {
    const { onChange, disabled } = useStockRoomSelectorContext();
    const queryClient = useQueryClient();

    const [newStockRoom, setNewStockRoom] = useState("");
    const [open, setOpen] = useState(false);

    const createStockRoomMutation = useMutation({
        mutationFn: async (data: { newStockRoom: string }) => {
            return await createStockRoom(data.newStockRoom);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["stock-rooms"] });
            onChange(data.stockRoom.stock_room_id);
            setOpen(false);
            setNewStockRoom("");
            if (isShortCut) {
                toast.success("Depósito creado");
            }
        },
        onError: (error: any) => {
            toast("Error al crear sala de stock", {
                description: error.message,
            });
        },
    });

    const handleCreateStockRoom = async () => {
        if (!newStockRoom) return;
        try {
            await createStockRoomMutation.mutateAsync({ newStockRoom });
        } catch (err) {
            console.error("Error creating stock room:", err);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isShortCut ?
                    <SidebarMenuButton>Depósito</SidebarMenuButton> : <Button
                        className="border border-gray-200"
                        disabled={disabled}
                        variant="outline"
                    >
                        + Nuevo
                    </Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear nueva sala de stock</DialogTitle>
                    <DialogDescription>
                        Ingresá el nombre de la nueva sala de stock que quieras crear.
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
    );
};

// ---------- Compound export ----------
export {
    StockroomSelectorRoot,
    SelectStockRoom,
    CreateStockRoom,
};

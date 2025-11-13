import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getStockRooms } from "@/service/stockRooms";
import { getUserStores } from "@/service/stores";
import type { LotContainersLocation } from "@/types/lotContainersLocation";
import type { Stock } from "@/types/stocks";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { default as StockLotContainerAssignation, default as StockLotContainerSelector } from "./StockLotContainerAssignation";

export default function StockAssignationContainer({
    disabled = false,
    initial_stock_quantity,
    stock,
    onChangeStock,
    lotContainersLocations,
    onChangeLotContainersLocations,
}: {
    disabled?: boolean;
    initial_stock_quantity?: number;
    stock?: Stock[];
    onChangeStock?: (nextStock: Stock[]) => void;
    lotContainersLocations: LotContainersLocation[];
    onChangeLotContainersLocations: (nextLotContainersLocations: LotContainersLocation[]) => void;
}) {
    console.log("StockAssignationContainer rendered", stock);
    console.log("StockAssignationContainer rendered", lotContainersLocations);
    // const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
    // const prevSelectedStoreId = useRef<number | null>(null);
    // // TODO: Obtener la tienda seleccionada desde el contexto o estado global si es necesario
    // console.log("Selected Store ID:", selectedStoreId);
    // const queryClient = useQueryClient();

    // const handleSelectStore = (storeId: number | null) => {
    //     console.log("Store selected:", storeId);
    //     queryClient.invalidateQueries({ queryKey: ["prices", productId, prevSelectedStoreId.current] });
    //     setSelectedStoreId(storeId);
    //     prevSelectedStoreId.current = storeId;

    // }

    const { data: stockRooms = [], isLoading: isLoadingStockRooms } = useQuery({
        queryKey: ["stock-rooms"],
        queryFn: async () => {
            const response = await getStockRooms();
            return response.stockRooms;
        },
    });


    const { data: stores = [], isLoading: isStoreLoading } = useQuery({
        queryKey: ["stores"],
        queryFn: async () => {
            const response = await getUserStores();
            return response.stores;
        },
    });


    if (isLoadingStockRooms || isStoreLoading) {
        return <Skeleton className="h-10 w-full" />;
    }

    const handleUpdateStock = (locationId: number, quantity: number, locationType: 'STORE' | 'STOCKROOM') => {
        if (!onChangeStock || !initial_stock_quantity) return;

        const totalOtherStocks =
            stock?.reduce((acc, s) => {
                const matches =
                    locationType === "STORE"
                        ? s.store_id === locationId
                        : s.stock_room_id === locationId;
                return matches ? acc : acc + (s.current_quantity || 0);
            }, 0) ?? 0;

        // Calcular total con la cantidad nueva incluida
        const totalWithNew = totalOtherStocks + quantity;

        // 🔴 Validar si supera el stock inicial
        if (totalWithNew > initial_stock_quantity) {
            toast.error(
                `La cantidad total (${totalWithNew}) supera el stock inicial (${initial_stock_quantity}).`
            );
            return; // detenemos la ejecución
        }



        const existingStockIndex = stock?.findIndex(s =>
            locationType === 'STORE' ? s.store_id === locationId : s.stock_room_id === locationId
        ) ?? -1;
        let updatedStock: Stock[] = [];

        if (existingStockIndex >= 0) {
            updatedStock = [...(stock || [])];
            updatedStock[existingStockIndex] = {
                ...updatedStock[existingStockIndex],
                current_quantity: quantity,
            };
        } else {
            const newStockEntry: Stock = {
                stock_id: Math.floor(Math.random() * 1000000),
                lot_id: Math.floor(Math.random() * 1000000),
                isNew: true,
                store_id: locationType === 'STORE' ? locationId : null,
                stock_room_id: locationType === 'STOCKROOM' ? locationId : null,
                current_quantity: quantity,
                min_notification: null,
                max_notification: null,
                stock_type: locationType,
                reserved_for_transfering_quantity: null,
                reserved_for_selling_quantity: null,
                transformed_from_product_id: null,
                transformed_to_product_id: null,
                last_updated: null,
            };
            updatedStock = [...(stock || []), newStockEntry];
            console.log("NupdatedStock:", updatedStock);
        }
        onChangeStock(updatedStock);
    };

    const remainingQuantityToAssign = (initial_stock_quantity ?? 0) - (stock?.reduce((acc, s) => acc + (s.current_quantity || 0), 0) || 0);

    return (
        <Card className="border-none p-2 shadow-none bg-transparent">
            <CardHeader className="w-full flex flex-row justify-between p-0">
                <CardTitle>Asignación de nuevo Stock</CardTitle>
                <div className="flex gap-2 items-center">
                    <Label className="font-medium">Cantidad disponible para asignar:</Label>
                    <Badge variant="secondary">{remainingQuantityToAssign || '0'}</Badge>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 p-0 ">
                <div className="flex flex-col gap-4">
                    {stockRooms.length === 0 ? (
                        <Badge variant="outline">No hay salas de stock disponibles.</Badge>
                    ) : (
                        stockRooms.map((room) => (
                            <div key={room.stock_room_id} className="flex gap-3 items-center">
                                <Label className="mb-2 font-medium w-36">{room.stock_room_name}</Label>
                                <Input
                                    type="number"
                                    placeholder="Cantidad a asignar"
                                    min={0}
                                    disabled={disabled}
                                    onChange={(e) => handleUpdateStock(room.stock_room_id, Number(e.target.value), 'STOCKROOM')}
                                    value={stock?.find(s => s.stock_room_id === room.stock_room_id)?.current_quantity || ''}
                                    className="w-[350px]"
                                />

                                <StockLotContainerSelector
                                    lotContainersLocations={lotContainersLocations}
                                    onChangeLotContainersLocation={(newLotContainerLocations) => {
                                        onChangeLotContainersLocations(newLotContainerLocations);
                                    }}
                                    stock_room_id={room.stock_room_id}
                                />

                                {/* Aquí puedes agregar más detalles o componentes relacionados con la asignación de stock */}
                            </div>
                        ))
                    )}
                </div>
                <div className="flex flex-col gap-4">
                    {stores.length === 0 ? (
                        <Badge variant="outline">No hay tiendas disponibles.</Badge>
                    ) : (
                        stores.map((store) => (
                            <div key={store.store_id} className="flex gap-3 items-center">
                                <Label className="mb-2 font-medium w-36">{store.store_name}</Label>
                                <Input

                                    type="number"
                                    placeholder="Cantidad a asignar"
                                    min={0}
                                    disabled={disabled}
                                    onChange={(e) => handleUpdateStock(store.store_id, Number(e.target.value), 'STORE')}
                                    value={stock?.find(s => s.store_id === store.store_id)?.current_quantity || ''}
                                    className="w-[350px]"
                                />

                                <StockLotContainerAssignation
                                    lotContainersLocations={lotContainersLocations}
                                    onChangeLotContainersLocation={(newLotContainerLocations) => {
                                        console.log("Updating lot container locations from store:", store.store_id, newLotContainerLocations);
                                        onChangeLotContainersLocations(newLotContainerLocations);
                                    }}
                                    store_id={store.store_id}
                                />

                            </div>
                        ))
                    )}
                </div>
            </CardContent>

            <CardContent>
                {/* <div className="flex flex-col gap-2">
                    <Label htmlFor="waste">Vacíos</Label>
                    <LotContainerSelector
                        disabled={false}
                        assignments={lot_containers ?? []}
                        initialQuantity={formData.initial_stock_quantity || 0}
                        onChange={(next) =>
                            onChangeFormData({
                                ...formData,
                                lot_containers: next,
                                has_lot_container: (next ?? []).some(
                                    (a) => (Number(a?.quantity) || 0) > 0
                                ),
                            })
                        }
                    />
                </div> */}
            </CardContent>
        </Card >

    );
}

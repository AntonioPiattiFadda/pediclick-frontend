import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getStockRooms } from "@/service/stockRooms";
import { getUserStores } from "@/service/stores";
import { useQuery } from "@tanstack/react-query";



export default function StockAssignationContainer({
    initial_stock_quantity,
}: {
    initial_stock_quantity?: number;
}) {

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
        queryKey: ["stockRooms"],
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

    console.log("Stores fetched:", stores);
    console.log("Stock rooms fetched:", stockRooms);
    if (isLoadingStockRooms || isStoreLoading) {
        return <Skeleton className="h-10 w-full" />;
    }

    return (
        <Card>
            <CardHeader className="w-full flex flex-row justify-between">
                <CardTitle>Asignación de nuevo Stock</CardTitle>
                <div className="flex gap-2 items-center">
                    <Label className="font-medium">Cantidad total a asignar:</Label>
                    <Badge variant="secondary">{initial_stock_quantity || '--'}</Badge>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    {stockRooms.length === 0 ? (
                        <Badge variant="outline">No hay salas de stock disponibles.</Badge>
                    ) : (
                        stockRooms.map((room) => (
                            <div key={room.store_id} className="flex gap-2 items-center">
                                <Label className="mb-2 font-medium">{room.stock_room_name}</Label>
                                <Input
                                    type="number"
                                    placeholder="Cantidad a asignar"
                                    min={0}
                                />

                                {/* Aquí puedes agregar más detalles o componentes relacionados con la asignación de stock */}
                            </div>
                        ))
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    {stores.length === 0 ? (
                        <Badge variant="outline">No hay tiendas disponibles.</Badge>
                    ) : (
                        stores.map((store) => (
                            <div key={store.id} className="flex gap-2 items-center">
                                <Label className="mb-2 font-medium">{store.store_name}</Label>
                                <Input
                                    type="number"
                                    placeholder="Cantidad a asignar"
                                    min={0}
                                />
                                {/* Aquí puedes agregar más detalles o componentes relacionados con la asignación de stock */}
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card >

    );
}

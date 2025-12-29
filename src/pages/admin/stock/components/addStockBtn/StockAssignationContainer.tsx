import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getLocations } from "@/service/locations";
import type { Location } from "@/types/locations";
import type { LotContainersStock } from "@/types/lotContainersStock";
import type { Stock } from "@/types/stocks";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useEffect } from "react";

export default function StockAssignationContainer({
    disabled = false,
    initial_stock_quantity,
    stock,
    onChangeStock,
    lotContainersStock,
    onChangeLotContainersStock,
}: {
    disabled?: boolean;
    initial_stock_quantity?: number;
    stock?: Stock[];
    onChangeStock?: (nextStock: Stock[]) => void;
    lotContainersStock: LotContainersStock[];
    onChangeLotContainersStock: (nextLotContainersStock: LotContainersStock[]) => void;
}) {
    const { data: locations = [], isLoading, isError } = useQuery({
        queryKey: ["locations"],
        queryFn: async () => {
            const response = await getLocations();
            return response.locations;
        },
    });

    useEffect(() => {
        if (!locations || locations.length === 0) return;

        let next = [...lotContainersStock];
        let updated = false;

        // registros base (los que tienen location null)
        const bases = lotContainersStock.filter(lc => !lc.location_id);
        const baseIds = new Set(bases.map(b => b.lot_container_id));

        // 1) ELIMINAR registros que NO deberían existir
        const filtered = next.filter(lc => {
            // si tiene location_id null → siempre queda
            if (!lc.location_id) return true;

            // si tiene location y su base existe → queda
            if (baseIds.has(lc.lot_container_id)) return true;

            // si tiene location y su base NO existe → eliminar
            updated = true;
            return false;
        });

        next = filtered;

        // 2) AGREGAR registros faltantes por cada location
        bases.forEach(origin => {
            locations.forEach(loc => {
                const exists = next.some(lc =>
                    lc.lot_container_id === origin.lot_container_id &&
                    lc.location_id === loc.location_id
                );

                if (!exists) {
                    next.push({
                        lot_container_id: origin.lot_container_id,
                        location_id: loc.location_id,
                        quantity: 0,
                        lot_container_stock_id: Math.floor(Math.random() * 1000000),
                        created_at: null,
                        client_id: null,
                        provider_id: null,
                        lot_container_status: "COMPLETED"
                    });
                    updated = true;
                }
            });
        });

        if (updated) {
            onChangeLotContainersStock(next);
        }

    }, [locations, lotContainersStock]);

    if (isLoading) {
        return <Skeleton className="h-10 w-full" />;
    }

    if (isError) {
        return <div>Error al cargar las ubicaciones</div>;
    }

    const handleUpdateStock = (locationId: number | null, quantity: number) => {
        if (!onChangeStock || !initial_stock_quantity || !locationId) return;

        const selectedLocation = locations.find((location) => location.id === locationId);
        const locationType = selectedLocation?.type;


        const totalOtherStocks =
            stock?.reduce((acc, s) => {
                const matches = s.location_id === locationId;
                return matches ? acc : acc + (s.quantity || 0);
            }, 0) ?? 0;

        // Calcular total con la cantidad nueva incluida
        const totalWithNew = totalOtherStocks + quantity;

        // 🔴 Validar si supera el stock inicial
        if (totalWithNew > initial_stock_quantity) {
            toast.error(
                `La cantidad supera el stock inicial (${initial_stock_quantity}).`
            );
            return; // detenemos la ejecución
        }



        const existingStockIndex = stock?.findIndex(s =>
            s.location_id === locationId
        ) ?? -1;

        let updatedStock: Stock[] = [];

        if (existingStockIndex >= 0) {
            updatedStock = [...(stock || [])];
            updatedStock[existingStockIndex] = {
                ...updatedStock[existingStockIndex],
                quantity: quantity,
            };
        } else {
            const newStockEntry: Stock = {
                stock_id: Math.floor(Math.random() * 1000000),
                lot_id: Math.floor(Math.random() * 1000000),
                is_new: true,
                quantity: quantity,
                location_id: locationId,
                min_notification: null,
                max_notification: null,
                stock_type: locationType,
                reserved_for_selling_quantity: null,
                reserved_for_transferring_quantity: null,
                transformed_from_product_id: null,
                updated_at: null,
                product_id: null,
            };
            updatedStock = [...(stock || []), newStockEntry];
        }

        console.log('Updated stock:', updatedStock);
        onChangeStock(updatedStock);
    };

    const remainingQuantityToAssign = (initial_stock_quantity ?? 0) - (stock?.reduce((acc, s) => acc + (s.quantity || 0), 0) || 0);

    const totalLotContainersStockAssigned = lotContainersStock?.filter(lc => lc.location_id)
        .reduce((acc, lcl) => acc + (lcl?.quantity || 0), 0) || 0;

    const totalLotContainersStockUnassigned = lotContainersStock?.filter(lc => !lc.location_id)
        .reduce((acc, lcl) => acc + (lcl?.quantity || 0), 0) || 0;

    const remainingLotContainersToAssign = totalLotContainersStockUnassigned - totalLotContainersStockAssigned;
    console.log('remainingLotContainersToAssign', remainingLotContainersToAssign);

    return (
        <Card className="border-none p-2 shadow-none bg-transparent">
            <CardContent className="grid grid-cols-1 gap-4 p-0 ">
                <div className="w-full grid grid-cols-2">
                    <div className="flex gap-1 items-center justify-center">
                        <CardTitle className="">Stock:</CardTitle>
                        <div className="flex gap-2 items-center">
                            <Label className="font-medium">Cantidad de stock para asignar:</Label>
                            <Badge variant="secondary">{remainingQuantityToAssign || '0'}</Badge>
                        </div>

                    </div>
                    {/* <div className="flex gap-1 items-center justify-center">
                        <CardTitle className="">Vacíos:</CardTitle>
                        <div className="flex gap-2 items-center">
                            <Label className="font-medium">Cantidad de vacios para asignar:</Label>
                            <Badge variant="secondary">{remainingLotContainersToAssign || '0'}</Badge>
                        </div>

                    </div> */}
                </div>
                <div className="flex flex-col gap-4">
                    {locations.length === 0 ? (
                        <Badge variant="outline">No hay ubicaciones disponibles.</Badge>
                    ) : (
                        locations.map((location: Location) => (
                            <div key={location.location_id} className="flex gap-3 items-center">
                                <Label className="mb-2 font-medium w-36">{location.name}</Label>
                                <Input
                                    type="number"
                                    placeholder="Cantidad a asignar"
                                    min={0}
                                    disabled={disabled}
                                    onChange={(e) => {
                                        handleUpdateStock(location.location_id || null, Number(e.target.value))
                                    }}
                                    value={stock?.find(s => s.location_id === location.location_id)?.quantity || ''}
                                    className="w-[150px]"
                                />

                                {/* <LotContainerStockAssignation
                                    lotContainersStock={lotContainersStock}
                                    onChangeLotContainersStock={(newLotContainersStock) => {
                                        onChangeLotContainersStock(newLotContainersStock);
                                    }}
                                    locationId={location.location_id}
                                    assignedStockQuantity={stock?.find(s => s.location_id === location.location_id)?.quantity || 0}

                                /> */}

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

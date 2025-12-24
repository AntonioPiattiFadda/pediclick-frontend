// import { getStockRooms } from '@/service/stockRooms';
// import { getUserStores } from '@/service/stores';
// import { useQuery } from '@tanstack/react-query';
// import {
//     Select,
//     SelectContent,
//     SelectGroup,
//     SelectItem,
//     SelectLabel,
//     SelectTrigger,
//     SelectValue,
// } from "@/components/ui/select"
// import type { Store } from '@/types/stores';
// import type { StockRoom } from '@/types/stockRooms';
// import { Skeleton } from '@/components/ui/skeleton';

// const LocationsSelector = ({
//     selectedLocationId,
//     onChangeSelectedLocation,
//     flexDirection = "row",
//     label = '',
//     placeholder = '',
//     disabled = false,
// }: {
//     selectedLocationId?: string | null;
//     onChangeSelectedLocation: (newLocationsId: number | null, locationType: "STORE" | "STOCK_ROOM") => void;
//     flexDirection?: "row" | "column";
//     label: string;
//     placeholder: string;
//     disabled?: boolean;
// }) => {

//     const {
//         data: stores = [],
//         isLoading: isLoadingStores,
//         isError: isErrorStores,
//     } = useQuery({
//         queryKey: ["stores"],
//         queryFn: async () => {
//             const response = await getUserStores();
//             return response.stores;
//         },
//     });

//     const { data: stockRooms, isLoading: isLoadingStockRooms, isError: isErrorStockRooms } = useQuery({
//         queryKey: ["stock-rooms"],
//         queryFn: async () => {
//             const response = await getStockRooms();
//             return response.stockRooms;
//         },
//     });

//     if (isLoadingStores || isLoadingStockRooms) {
//         return <Skeleton className="h-10 w-48" />;
//     }

//     if (isErrorStores || isErrorStockRooms) {
//         return <div>Error al cargar ubicaciones.</div>;
//     }

//     const handleChangeLocation = (value: string) => {
//         const [type, id] = value.split("-");
//         const parsedId = Number(id);
//         if (type === "store") {
//             onChangeSelectedLocation(parsedId, "STORE");
//         } else if (type === "stock") {
//             onChangeSelectedLocation(parsedId, "STOCK_ROOM");
//         }
//     };


//     return (<div className={`flex gap-2 w-full ${flexDirection === "row" ? "flex-row items-center" : "flex-col"}`} >
//         {label && <label>{label}:</label>}
//         <Select value={selectedLocationId ?? ""} onValueChange={(newLocation) => handleChangeLocation(newLocation)}>
//             <SelectTrigger className="w-full" disabled={disabled}>
//                 <SelectValue placeholder={placeholder} />
//             </SelectTrigger>
//             <SelectContent>
//                 <SelectGroup>
//                     <SelectLabel>{label}</SelectLabel>
//                     {stores.map((store: Store) => (
//                         <SelectItem key={`store-${store.store_id}`} value={`store-${store.store_id}`}>
//                             {store.store_name}
//                         </SelectItem>
//                     ))}

//                     {stockRooms.map((room: StockRoom) => (
//                         <SelectItem key={`stock-${room.stock_room_id}`} value={`stock-${room.stock_room_id}`}>
//                             {room.stock_room_name}
//                         </SelectItem>
//                     ))}
//                 </SelectGroup>
//             </SelectContent>
//         </Select>



//     </div >


//     )
// }

// export default LocationsSelector
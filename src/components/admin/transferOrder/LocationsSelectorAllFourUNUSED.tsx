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

// const LocationsSelectorAllFour = ({
//     fromStoreId,
//     toStoreId,
//     fromStockRoomId,
//     toStockRoomId,
//     onChangeFromLocationId,
//     onChangeToLocationId,
// }: {
//     fromStoreId?: number | null;
//     toStoreId?: number | null;
//     fromStockRoomId?: number | null;
//     toStockRoomId?: number | null;
//     onChangeFromLocationId: (newLocations: {
//         from_store_id?: number | null;
//         from_stock_room_id?: number | null;
//         to_store_id?: number | null;
//         to_stock_room_id?: number | null;
//     }) => void;
//     onChangeToLocationId: (newLocations: {
//         from_store_id?: number | null;
//         from_stock_room_id?: number | null;
//         to_store_id?: number | null;
//         to_stock_room_id?: number | null;
//     }) => void;
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
//         return <div>Cargando ubicaciones...</div>;
//     }

//     if (isErrorStores || isErrorStockRooms) {
//         return <div>Error al cargar ubicaciones.</div>;
//     }

//     const handleChangeFromLocation = (value: string) => {
//         const [type, id] = value.split("-");
//         console.log(type, id);
//         const parsedId = Number(id);

//         if (type === "store") {
//             onChangeFromLocationId({
//                 from_store_id: parsedId,
//                 from_stock_room_id: null,

//             });
//         } else if (type === "stock") {
//             onChangeFromLocationId({
//                 from_store_id: null,
//                 from_stock_room_id: parsedId,
//             });
//         }
//     };

//     const handleChangeToLocation = (value: string) => {
//         const [type, id] = value.split("-");
//         console.log(type, id);
//         const parsedId = Number(id);

//         if (type === "store") {
//             onChangeToLocationId({
//                 to_store_id: parsedId,
//                 to_stock_room_id: null,
//             });
//         } else if (type === "stock") {
//             onChangeToLocationId({
//                 to_store_id: null,
//                 to_stock_room_id: parsedId,
//             });
//         }
//     };
//     const fromLocationId =
//         fromStoreId
//             ? `store-${fromStoreId}`
//             : fromStockRoomId
//                 ? `stock-${fromStockRoomId}`
//                 : "";

//     const toLocationId =
//         toStoreId
//             ? `store-${toStoreId}`
//             : toStockRoomId
//                 ? `stock-${toStockRoomId}`
//                 : "";



//     return (


//         <div className='flex gap-2'>


//             <div>
//                 <label htmlFor="fromLocation">Desde:</label>
//                 <Select value={fromLocationId?.toString() || ''} onValueChange={(newLocation) => handleChangeFromLocation(newLocation)}>
//                     <SelectTrigger className="w-[180px]">
//                         <SelectValue placeholder="Desde" />
//                     </SelectTrigger>
//                     <SelectContent>
//                         <SelectGroup>
//                             <SelectLabel>Desde</SelectLabel>

//                             {stores.map((store: Store) => (
//                                 <SelectItem key={`store-${store.store_id}`} value={`store-${store.store_id}`}>
//                                     {store.store_name}
//                                 </SelectItem>
//                             ))}

//                             {stockRooms.map((room: StockRoom) => (
//                                 <SelectItem key={`stock-${room.stock_room_id}`} value={`stock-${room.stock_room_id}`}>
//                                     {room.stock_room_name}
//                                 </SelectItem>
//                             ))}
//                         </SelectGroup>
//                     </SelectContent>
//                 </Select>
//             </div>

//             <div>
//                 <label htmlFor="fromLocation">Hasta:</label>
//                 <Select value={toLocationId?.toString() || ''} onValueChange={(newLocation) => handleChangeToLocation(newLocation)}>
//                     <SelectTrigger className="w-[180px]">
//                         <SelectValue placeholder="Desde" />
//                     </SelectTrigger>
//                     <SelectContent>
//                         <SelectGroup>
//                             <SelectLabel>Desde</SelectLabel>
//                             {stores.map((store: Store) => (
//                                 <SelectItem key={`store-${store.store_id}`} value={`store-${store.store_id}`}>
//                                     {store.store_name}
//                                 </SelectItem>
//                             ))}

//                             {stockRooms.map((room: StockRoom) => (
//                                 <SelectItem key={`stock-${room.stock_room_id}`} value={`stock-${room.stock_room_id}`}>
//                                     {room.stock_room_name}
//                                 </SelectItem>
//                             ))}
//                         </SelectGroup>
//                     </SelectContent>
//                 </Select>
//             </div>

//         </div>


//     )
// }

// export default LocationsSelectorAllFour
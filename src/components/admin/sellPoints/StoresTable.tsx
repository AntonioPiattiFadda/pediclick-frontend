import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUserStoresContext } from "@/contexts/UserStoresContext";
import { EditStoreBtn } from "./EditStoreBtn";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteTableElementPopUp } from "../shared/deleteTableElementPopUp";
import { deleteStore } from "@/service/stores";

export const StoresTable = () => {
  const { userStores, setUserStores, setSelectedStoreId, selectedStoreId } =
    useUserStoresContext();

  const handleDeleteStore = async (id: string | number) => {
    try {
      await deleteStore(id);
      const remainingStores = userStores.filter(
        (store) => store.store_id !== id
      );
      setUserStores(remainingStores);
      if (id === selectedStoreId) {
        setSelectedStoreId(remainingStores[0]?.store_id || null);
      }
    } catch (error) {
      console.error("Error deleting store:", error);
    }
  };

  if (userStores.length === 0) {
    return (
      <div>
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <div className="rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead >Acciones</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripcion</TableHead>
            <TableHead>Direccion</TableHead>
            <TableHead>Telefono</TableHead>
            <TableHead>Whatsapp</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Sitio Web</TableHead>
            <TableHead>Redes sociales</TableHead>
            <TableHead>Horarios</TableHead>
            <TableHead>Nombre e-commerce</TableHead>

          </TableRow>
        </TableHeader>
        <TableBody>
          {userStores.map((store) => (
            <TableRow key={store.store_id}>
                <TableCell className="text-right flex gap-2">
                {" "}
                <EditStoreBtn id={store.store_id} />
                <DeleteTableElementPopUp
                  elementId={store.store_id}
                  elementName={store.store_name}
                  deleteFn={async (id: string | number) => {
                    await handleDeleteStore(id);
                  }}
                  queryKey={["stores"]}
                  successMsgTitle="Punto de venta eliminado"
                  successMsgDescription="El punto de venta ha sido eliminado correctamente."
                  errorMsgTitle="Error al eliminar punto de venta"
                  errorMsgDescription="Ha ocurrido un error al eliminar el punto de venta."
                />
              </TableCell>
              <TableCell>{store.store_name}</TableCell>
              <TableCell>{store.description || "-"}</TableCell>
              <TableCell>{store.address || "-"}</TableCell>
              <TableCell>{store.phone || "-"}</TableCell>
              <TableCell>{store.whatsapp || "-"}</TableCell>
              <TableCell>{store.email || "-"}</TableCell>
              <TableCell>{store.website || "-"}</TableCell>
              <TableCell>{store.social_links || "-"}</TableCell>
              <TableCell>{store.opening_hours || "-"}</TableCell>
              <TableCell>{store.slug || "-"}</TableCell>
            
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

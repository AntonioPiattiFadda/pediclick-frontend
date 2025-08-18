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

export const StoresTable = () => {
  const { userStores } = useUserStoresContext();

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

            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {userStores.map((store) => (
            <TableRow key={store.store_id}>
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
              <TableCell className="text-right flex gap-2">
                {" "}
                <EditStoreBtn id={store.store_id} />
                {/* <DeleteTableElement
                  id={store.store_id}
                  endpoint={async (id: string | number) => {
                    await deleteTeamMember(id);
                  }}
                  queryKey={["stores"]}
                /> */}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

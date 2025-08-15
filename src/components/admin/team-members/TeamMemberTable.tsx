import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TeamMember } from "@/types";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Edit, Trash2 } from "lucide-react";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import type { Product } from "@/types";
// import { getCurrencySymbol } from "@/utils";
// import { Input } from "../ui/input";
// import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { deleteProduct } from "@/service";

interface TeamMemberTableProps {
  teamMembers: TeamMember[];
}

export const TeamMemberTable = ({ teamMembers }: TeamMemberTableProps) => {
  // const queryClient = useQueryClient();

  // const getStatusBadge = (status: string, stock: number) => {
  //   if (stock === 0) {
  //     return <Badge variant="destructive">Sin Stock</Badge>;
  //   }
  //   switch (status) {
  //     case "active":
  //       return <Badge variant="default">Activo</Badge>;
  //     case "draft":
  //       return <Badge variant="secondary">Borrador</Badge>;
  //     case "out_of_stock":
  //       return <Badge variant="destructive">Sin Stock</Badge>;
  //     default:
  //       return <Badge variant="secondary">{status}</Badge>;
  //   }
  // };

  // const deleteProductMutation = useMutation({
  //   mutationFn: async (productId: string | number) => {
  //     await deleteProduct(productId); // tu función para eliminar
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["products"] }); // refresca los productos
  //   },
  // });

  return (
    <div className="rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead className="text-center">Stock</TableHead>
            <TableHead className="text-center">Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teamMembers.length > 0 ? (
            teamMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        className="object-cover"
                        src={member.avatar_url ? member.avatar_url : "/default-avatar.png"}
                        alt={member.full_name}
                      />
                      <AvatarFallback>
                        {member.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      {/* <p className="font-medium">{member.name}</p> */}
                      <p className="text-sm text-muted-foreground">
                        {/* {member.sku} */}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{member.role}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                No hay miembros en el equipo.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

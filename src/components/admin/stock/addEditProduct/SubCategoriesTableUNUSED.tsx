import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../../ui/avatar";
import type { SubCategory } from "@/types/subCategories";

interface CategoriesTableProps {
  subCategories: SubCategory[];
}

export const SubCategoriesTable = ({ subCategories }: CategoriesTableProps) => {
  // const getStatusBadge = (status: string) => {
  //   switch (status) {
  //     case 'active':
  //       return <Badge variant="default">Activa</Badge>;
  //     case 'inactive':
  //       return <Badge variant="secondary">Inactiva</Badge>;
  //     default:
  //       return <Badge variant="secondary">{status}</Badge>;
  //   }
  // };

  return (
    <div className="rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            {/* <TableHead>Descripción</TableHead> */}
            {/* <TableHead>Categoría Padre</TableHead> */}
            <TableHead className="text-center">Productos</TableHead>
            {/* <TableHead className="text-center">Estado</TableHead> */}
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>


          {subCategories.map((category) => (
            <TableRow key={category.sub_category_id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage
                      src={category.image_url}
                      alt={category.sub_category_name}
                    />
                    <AvatarFallback>
                      {category.sub_category_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{category.sub_category_name}</p>
                    {/* <p className="text-sm text-muted-foreground">{category.sku}</p> */}
                  </div>
                </div>
              </TableCell>
              {/* <TableCell>
                <p className="text-sm">{category.description}</p>
              </TableCell> */}
              {/* <TableCell>
                {category.parent ? (
                  <Badge variant="outline">{category.parent}</Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell> */}
              <TableCell className="text-center font-medium">
                {/* {category.productsCount}  */} Aggregar el conteo de
                productos
              </TableCell>
              {/* <TableCell className="text-center">
                {getStatusBadge(category.status)}
              </TableCell> */}
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

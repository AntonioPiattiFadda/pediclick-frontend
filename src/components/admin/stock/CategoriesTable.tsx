import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import type { Category } from "@/types/categories";

interface CategoriesTableProps {
  categories: Category[];

}

export const CategoriesTable = ({ categories }: CategoriesTableProps) => {


  return (
    <div className="rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.category_id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage
                      src={category.image_url}
                      alt={category.category_name}
                    />
                    <AvatarFallback>
                      {category.category_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{category.category_name}</p>
                    {/* <p className="text-sm text-muted-foreground">{category.sku}</p> */}
                  </div>
                </div>
              </TableCell>

              <TableCell className="text-right">
                <div className="flex justify-end gap-2">

                  {/* <Button size="sm" variant="outline">
                    <Trash2 className="w-4 h-4" />
                  </Button> */}
                </div>
              </TableCell>
            </TableRow>
          ))}

        </TableBody>
      </Table>
    </div>
  );
};

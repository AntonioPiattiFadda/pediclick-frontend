import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Lot } from "@/types/lots";
import { AddLotBtn } from "../shared/addLotBtn";

export const AddLoadOrderTable = ({ formData }: { formData: Lot[] }) => {
  //Este componmente solo renderiza las LoadOrders

  return (
    <div className="rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>X</TableHead>
            <TableHead>X</TableHead>
            <TableHead>X</TableHead>
            <TableHead>X</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {formData.length > 0 ? (
            formData.map((lot, index) => (
              <TableRow key={index}>
                <TableCell>{lot.lot_number}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No hay lotes asignados
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <AddLotBtn />
      </Table>
    </div>
  );
};

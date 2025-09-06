import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Lot } from "@/types/lots";
import { AddLotBtn } from "../shared/addLotBtn";

export const AddLoadOrderTable = ({
  loadOrderLots,
  onAddElementToLoadOrder,
}: {
  loadOrderLots: Lot[];
  onAddElementToLoadOrder: (lot: Lot) => void;
}) => {
  return (
    <div className="rounded-md">
      <Table>
        <TableCaption className="py-2 pb-6">
          {" "}
          <AddLotBtn onAddElementToLoadOrder={onAddElementToLoadOrder} />
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre del producto</TableHead>
            <TableHead>Numero de lote</TableHead>
            <TableHead>Stock inicial</TableHead>
            <TableHead>Fecha de vencimiento</TableHead>
            <TableHead>Precio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loadOrderLots.length > 0 ? (
            loadOrderLots.map((lot, index) => (
              <TableRow key={index}>
                <TableCell>{lot.product_name}</TableCell>
                <TableCell>{lot.lot_number}</TableCell>
                <TableCell>{lot.initial_stock_quantity || "-"}</TableCell>
                <TableCell>{lot.expiration_date || "-"}</TableCell>
                <TableCell>
                  {lot.prices?.map((price) => price.unit_price).join(", ") ||
                    "-"}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center translate-y-3">
                No hay lotes asignados
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

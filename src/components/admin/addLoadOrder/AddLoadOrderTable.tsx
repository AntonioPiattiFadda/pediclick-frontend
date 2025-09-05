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

export const AddLoadOrderTable = ({
  loadOrderLots,
  onAddElementToLoadOrder,
}: {
  loadOrderLots: Lot[];
  onAddElementToLoadOrder: (lot: Lot) => void;
}) => {
  console.log("loadOrderLots en tabla", loadOrderLots);

  return (
    <div className="rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombbre del producto</TableHead>
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
                {/* <TableCell>{lot.price || '-'}</TableCell> */}
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
        <AddLotBtn onAddElementToLoadOrder={onAddElementToLoadOrder} />
      </Table>
    </div>
  );
};

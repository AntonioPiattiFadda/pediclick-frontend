import { useEffect, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Lot } from "@/types/lots";
import { AddLotBtn } from "../shared/addLotBtn";
import { LotContainerSelector } from "./lotContainerSelector";
import { DeleteTableElementPopUp } from "../shared/deleteTableElementPopUp";
import GetFollowingLotNumberBtn from "@/components/unassigned/getFollowingLotNumberBtn";

type EditableCellProps = {
  value: string | number | null | undefined;
  type?: "text" | "number" | "date";
  disabled?: boolean;
  placeholder?: string;
  align?: "left" | "right" | "center";
  onSave: (value: string) => void;
};
function EditableCell({
  value,
  type = "text",
  disabled = false,
  placeholder = "-",
  align = "left",
  onSave,
}: EditableCellProps) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState(
    value === null || value === undefined ? "" : String(value)
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronizar valor y seleccionar al abrir
  useEffect(() => {
    if (open) {
      const val = value === null || value === undefined ? "" : String(value);
      setLocal(val);

      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      });
    }
  }, [open, value]);

  const display =
    value === null || value === undefined || value === ""
      ? placeholder
      : String(value);

  const handleSave = () => {
    onSave(local);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={`w-full text-${align} hover:underline underline-offset-4 disabled:opacity-50`}
          onClick={() => setOpen(true)}
        >
          {display}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="flex flex-col gap-3">
          <Input
            ref={inputRef}
            type={type}
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSave();
              }
            }}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Guardar</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}




type LotContainerCellProps = {
  assignments: Lot["lot_containers"] | undefined;
  initialStock: number;
  disabled?: boolean;
  onSave: (assignments: Lot["lot_containers"]) => void;
};

function LotContainerCell({
  assignments,
  initialStock,
  disabled = false,
  onSave,
}: LotContainerCellProps) {
  const [open, setOpen] = useState(false);
  const totalAssigned = (assignments ?? []).reduce(
    (sum, a) => sum + (Number(a?.quantity) || 0),
    0
  );
  const display =
    totalAssigned > 0
      ? `${totalAssigned}/${initialStock}`
      : "Sin vacíos";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="w-full text-left hover:underline underline-offset-4 disabled:opacity-50"
          onClick={() => setOpen(true)}
        >
          {display}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px]">
        <div className="flex flex-col gap-3">
          <LotContainerSelector
            assignments={assignments ?? []}
            initialQuantity={Number(initialStock) || 0}
            disabled={disabled}
            onChange={(next) => onSave(next)}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export const AddLoadOrderTable = ({
  loadOrderLots,
  onAddElementToLoadOrder,
  onUpdateLot,
  onDeleteLot,
}: {
  loadOrderLots: Lot[];
  onAddElementToLoadOrder: (lot: Lot) => void;
  onUpdateLot?: (index: number, patch: Partial<Lot>) => void;
  onDeleteLot?: (index: number) => void;
}) => {
  return (
    <div className="rounded-md overflow-x-auto">
      <Table>
        <TableCaption className="py-2 pb-6">
          <AddLotBtn onAddElementToLoadOrder={onAddElementToLoadOrder} />
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Nro Lote</TableHead>
            <TableHead className="text-right">Stock inicial</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead className="text-right">Compra total</TableHead>
            <TableHead className="text-right">Compra / unidad</TableHead>
            <TableHead className="text-right">Descarga total</TableHead>
            <TableHead className="text-right">Descarga / unidad</TableHead>
            <TableHead>Vacío</TableHead>
            <TableHead>Precios</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {loadOrderLots.length > 0 ? (
            loadOrderLots.map((lot, index) => (
              <TableRow key={lot.lot_id ?? `${lot.product_id}-${lot.lot_number ?? "new"}-${index}`}>
                {/* Acciones: eliminar */}
                <TableCell>
                  <DeleteTableElementPopUp
                    elementId={index}
                    queryKey={["load-order-form-lots"]}
                    elementName={lot.product_name}
                    successMsgTitle="Lote eliminado"
                    successMsgDescription="El lote fue eliminado del remito."
                    errorMsgTitle="Error al eliminar"
                    errorMsgDescription="No se pudo eliminar el lote del remito."
                    deleteFn={async () => {
                      onDeleteLot?.(index);
                      return true;
                    }}
                  />
                </TableCell>
                {/* Producto (solo lectura) */}
                <TableCell>{lot.product_name || "-"}</TableCell>

                {/* Nro de Lote */}
                <TableCell>
                  <div className="grid grid-cols-[1fr_50px] gap-2">
                    <EditableCell
                      value={lot.lot_number}
                      type="number"
                      onSave={(val) =>
                        onUpdateLot?.(index, {
                          lot_number: val === "" ? null : Number(val),
                        })
                      }
                    />
                    <GetFollowingLotNumberBtn onClick={(nextLotNumber) => {
                      onUpdateLot?.(index, { lot_number: nextLotNumber });
                    }} productId={lot.product_id} />
                  </div>
                </TableCell>

                {/* Stock inicial */}
                <TableCell className="text-right">
                  <EditableCell
                    value={lot.initial_stock_quantity}
                    type="number"
                    align="right"
                    onSave={(val) =>
                      onUpdateLot?.(index, {
                        initial_stock_quantity: Number(val) || 0,
                      })
                    }
                  />
                </TableCell>

                {/* Vencimiento */}
                <TableCell>
                  <EditableCell
                    value={lot.expiration_date}
                    type="date"
                    onSave={(val) =>
                      onUpdateLot?.(index, {
                        expiration_date: val || null,
                      })
                    }
                  />
                </TableCell>

                {/* Compra total */}
                <TableCell className="text-right">
                  <EditableCell
                    value={lot.purchase_cost_total}
                    type="number"
                    align="right"
                    onSave={(val) =>
                      onUpdateLot?.(index, {
                        purchase_cost_total: Number(val) || 0,
                      })
                    }
                  />
                </TableCell>

                {/* Compra / unidad */}
                <TableCell className="text-right">
                  <EditableCell
                    value={lot.purchase_cost_per_unit}
                    type="number"
                    align="right"
                    onSave={(val) =>
                      onUpdateLot?.(index, {
                        purchase_cost_per_unit: Number(val) || 0,
                      })
                    }
                  />
                </TableCell>

                {/* Descarga total */}
                <TableCell className="text-right">
                  <EditableCell
                    value={lot.download_total_cost}
                    type="number"
                    align="right"
                    onSave={(val) =>
                      onUpdateLot?.(index, {
                        download_total_cost: Number(val) || 0,
                      })
                    }
                  />
                </TableCell>

                {/* Descarga / unidad */}
                <TableCell className="text-right">
                  <EditableCell
                    value={lot.download_cost_per_unit}
                    type="number"
                    align="right"
                    onSave={(val) =>
                      onUpdateLot?.(index, {
                        download_cost_per_unit: Number(val) || 0,
                      })
                    }
                  />
                </TableCell>

                {/* Vacíos (múltiples asignaciones) */}
                <TableCell>
                  <LotContainerCell
                    assignments={lot.lot_containers}
                    initialStock={lot.initial_stock_quantity}
                    onSave={(nextAssignments) =>
                      onUpdateLot?.(index, {
                        lot_containers: nextAssignments,
                        has_lot_container:
                          (nextAssignments ?? []).some(
                            (a) => (Number(a?.quantity) || 0) > 0
                          ),
                      })
                    }
                  />
                </TableCell>

                {/* Precios (solo vista rápida) */}
                <TableCell>{lot.prices?.map((p) => p.unit_price).join(", ") || "-"}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={11} className="text-center translate-y-3">
                No hay lotes asignados
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

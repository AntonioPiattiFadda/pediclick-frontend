import ManageProductPrices from "@/components/admin/pricesManagement.tsx/ManageProductPricesTabs";
import { MoneyInput } from "@/components/admin/ui/MoneyInput";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateLotCosts } from "@/service/lots";
import type { Lot } from "@/types/lots";
import type { ProductPresentation } from "@/types/productPresentation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Info, Pencil } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { calcFromBulk, calcFromTotal, calcFromUnit } from "./costCalculations";

export function EditLotCostsBtn({
  lot,
  productName,
  productPresentation,
}: {
  lot: Lot;
  productName: string;
  productPresentation: Pick<
    ProductPresentation,
    | "product_presentation_id"
    | "product_presentation_name"
    | "bulk_quantity_equivalence"
    | "sell_unit"
  >;
}) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Lot>(lot);

  const mutation = useMutation({
    mutationFn: async (data: Partial<Lot>) => updateLotCosts(lot.lot_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Costos del lote actualizados");
      setIsOpen(false);
    },
    onError: (error) => {
      const msg =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: unknown }).message)
          : "Error desconocido";
      toast.error("Error al actualizar: " + msg);
    },
  });

  const handleOpen = (open: boolean) => {
    if (open) setFormData(lot);
    setIsOpen(open);
  };

  const handleUpdateLotField = (field: string, rawValue: number | string) => {
    const isNumericField = [
      "extra_cost_total",
      "purchase_cost_per_bulk",
      "purchase_cost_per_unit",
      "purchase_cost_total",
      "download_cost_per_bulk",
      "download_cost_per_unit",
      "download_total_cost",
      "delivery_cost_per_bulk",
      "delivery_cost_per_unit",
      "delivery_cost_total",
    ].includes(field);

    const value = isNumericField ? (Number(rawValue) || 0) : rawValue;
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const equiv = productPresentation.bulk_quantity_equivalence ?? 0;
    const stock = formData.initial_stock_quantity ?? 0;

    let purchase = {
      per_bulk: formData.purchase_cost_per_bulk ?? 0,
      per_unit: formData.purchase_cost_per_unit ?? 0,
      total: formData.purchase_cost_total ?? 0,
    };
    let download = {
      per_bulk: formData.download_cost_per_bulk ?? 0,
      per_unit: formData.download_cost_per_unit ?? 0,
      total: formData.download_total_cost ?? 0,
    };
    let delivery = {
      per_bulk: formData.delivery_cost_per_bulk ?? 0,
      per_unit: formData.delivery_cost_per_unit ?? 0,
      total: formData.delivery_cost_total ?? 0,
    };
    let extraTotal = formData.extra_cost_total ?? 0;

    switch (field) {
      case "purchase_cost_per_bulk": purchase = calcFromBulk(value as number, stock, equiv); break;
      case "purchase_cost_per_unit": purchase = calcFromUnit(value as number, stock, equiv); break;
      case "purchase_cost_total": purchase = calcFromTotal(value as number, stock, equiv); break;

      case "download_cost_per_bulk": download = calcFromBulk(value as number, stock, equiv); break;
      case "download_cost_per_unit": download = calcFromUnit(value as number, stock, equiv); break;
      case "download_total_cost": download = calcFromTotal(value as number, stock, equiv); break;

      case "delivery_cost_per_bulk": delivery = calcFromBulk(value as number, stock, equiv); break;
      case "delivery_cost_per_unit": delivery = calcFromUnit(value as number, stock, equiv); break;
      case "delivery_cost_total": delivery = calcFromTotal(value as number, stock, equiv); break;

      case "extra_cost_total": extraTotal = value as number; break;
    }

    const extraPerBulk = round2(extraTotal / (stock || 1));
    const extraPerUnit = round2(extraPerBulk / (equiv || 1));

    setFormData(prev => ({
      ...prev,
      purchase_cost_per_bulk: purchase.per_bulk,
      purchase_cost_per_unit: purchase.per_unit,
      purchase_cost_total: purchase.total,

      download_cost_per_bulk: download.per_bulk,
      download_cost_per_unit: download.per_unit,
      download_total_cost: download.total,

      delivery_cost_per_bulk: delivery.per_bulk,
      delivery_cost_per_unit: delivery.per_unit,
      delivery_cost_total: delivery.total,

      extra_cost_total: round2(extraTotal),
      extra_cost_per_unit: extraPerUnit,

      final_cost_total: equiv ? round2(purchase.total + download.total + delivery.total + extraTotal) : null,
      final_cost_per_bulk: equiv ? round2(purchase.per_bulk + download.per_bulk + delivery.per_bulk + extraPerBulk) : null,
      final_cost_per_unit: equiv ? round2(purchase.per_unit + download.per_unit + delivery.per_unit + extraPerUnit) : null,
    }));
  };

  const handleSubmit = () => {
    mutation.mutate({
      purchase_cost_per_bulk: formData.purchase_cost_per_bulk,
      purchase_cost_per_unit: formData.purchase_cost_per_unit,
      purchase_cost_total: formData.purchase_cost_total,
      download_cost_per_bulk: formData.download_cost_per_bulk,
      download_cost_per_unit: formData.download_cost_per_unit,
      download_total_cost: formData.download_total_cost,
      delivery_cost_per_bulk: formData.delivery_cost_per_bulk,
      delivery_cost_per_unit: formData.delivery_cost_per_unit,
      delivery_cost_total: formData.delivery_cost_total,
      extra_cost_total: formData.extra_cost_total,
      extra_cost_per_unit: formData.extra_cost_per_unit,
      final_cost_total: formData.final_cost_total,
      final_cost_per_bulk: formData.final_cost_per_bulk,
      final_cost_per_unit: formData.final_cost_per_unit,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-2 w-[90vw] max-w-[1400px] max-h-[90vh] min-h-[500px] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Editar costos del lote — {productName}</DialogTitle>
        </DialogHeader>

        {/* Info de solo lectura */}
        <div className="grid grid-cols-3 gap-4 rounded-lg border bg-muted/40 px-4 py-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Producto</Label>
            <p className="text-sm font-medium">{productName}</p>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Presentación</Label>
            <p className="text-sm font-medium">
              {productPresentation.product_presentation_name ?? "--"}
              {productPresentation.bulk_quantity_equivalence
                ? ` (${productPresentation.bulk_quantity_equivalence} u/kg)`
                : ""}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Stock inicial</Label>
            <Input
              disabled
              value={formData.initial_stock_quantity ?? 0}
              className="h-8 bg-background"
            />
          </div>
        </div>

        <div className="flex flex-row gap-4 flex-1 overflow-hidden min-h-0">

          {/* LEFT: costos */}
          <div className="flex flex-col gap-2 flex-1 min-w-0 overflow-y-auto pr-1">

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground text-center">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>
                El stock inicial es de solo lectura. Los costos se recalculan{" "}
                <strong>automáticamente</strong> desde el costo por bulto.
              </span>
            </div>

            <Card className="border-none p-2 shadow-none bg-transparent">
              {/* Header */}
              <div className="grid grid-cols-[120px_1fr_1fr_1fr] gap-3 w-full mb-1 px-1">
                <div />
                <p className="text-xs font-medium text-muted-foreground text-center">Por bulto</p>
                <p className="text-xs font-medium text-muted-foreground text-center">Por unidad / Kg</p>
                <p className="text-xs font-medium text-muted-foreground text-center">Total</p>
              </div>

              {/* Compra */}
              <div className="grid grid-cols-[120px_1fr_1fr_1fr] gap-3 w-full items-end">
                <p className="text-sm font-medium pb-2 text-right pr-2">Compra</p>
                <MoneyInput value={formData.purchase_cost_per_bulk || undefined} onChange={(v) => handleUpdateLotField("purchase_cost_per_bulk", Number(v))} />
                <MoneyInput value={formData.purchase_cost_per_unit || undefined} onChange={(v) => handleUpdateLotField("purchase_cost_per_unit", Number(v))} />
                <MoneyInput value={formData.purchase_cost_total || undefined} onChange={(v) => handleUpdateLotField("purchase_cost_total", Number(v))} />
              </div>

              {/* Envío */}
              <div className="grid grid-cols-[120px_1fr_1fr_1fr] gap-3 w-full items-end mt-2">
                <p className="text-sm font-medium pb-2 text-right pr-2">Envío</p>
                <MoneyInput value={formData.delivery_cost_per_bulk || undefined} onChange={(v) => handleUpdateLotField("delivery_cost_per_bulk", v ?? 0)} />
                <MoneyInput value={formData.delivery_cost_per_unit || undefined} onChange={(v) => handleUpdateLotField("delivery_cost_per_unit", v ?? 0)} />
                <MoneyInput value={formData.delivery_cost_total || undefined} onChange={(v) => handleUpdateLotField("delivery_cost_total", v ?? 0)} />
              </div>

              {/* Descarga */}
              <div className="grid grid-cols-[120px_1fr_1fr_1fr] gap-3 w-full items-end mt-2">
                <p className="text-sm font-medium pb-2 text-right pr-2">Descarga</p>
                <MoneyInput value={formData.download_cost_per_bulk || undefined} onChange={(v) => handleUpdateLotField("download_cost_per_bulk", v ?? 0)} />
                <MoneyInput value={formData.download_cost_per_unit || undefined} onChange={(v) => handleUpdateLotField("download_cost_per_unit", v ?? 0)} />
                <MoneyInput value={formData.download_total_cost || undefined} onChange={(v) => handleUpdateLotField("download_total_cost", v ?? 0)} />
              </div>

              {/* Extra */}
              <div className="grid grid-cols-[120px_1fr_1fr_1fr] gap-3 w-full items-end mt-2">
                <p className="text-sm font-medium pb-2 text-right pr-2">Extra</p>
                <div /><div />
                <MoneyInput value={formData.extra_cost_total || undefined} onChange={(v) => handleUpdateLotField("extra_cost_total", v ?? 0)} />
              </div>

              {/* Final (read-only) */}
              <div className="grid grid-cols-[120px_1fr_1fr_1fr] gap-3 w-full items-end mt-2 pt-2 border-t">
                <p className="text-sm font-semibold pb-2 text-right pr-2">Total final</p>
                <MoneyInput disabled value={formData.final_cost_per_bulk || undefined} onChange={() => { }} />
                <MoneyInput disabled value={formData.final_cost_per_unit || undefined} onChange={() => { }} />
                <MoneyInput disabled value={formData.final_cost_total || undefined} onChange={() => { }} />
              </div>
            </Card>
          </div>

          {/* RIGHT: precios */}
          <div className="w-[520px] shrink-0 border-l pl-4 overflow-y-auto flex flex-col gap-2">
            <p className="text-sm font-medium">Precios</p>
            <ManageProductPrices
              mode="inline"
              productPresentationId={productPresentation.product_presentation_id}
              finalCost={{
                final_cost_total: formData.final_cost_total ?? null,
                final_cost_per_unit: formData.final_cost_per_unit ?? null,
                final_cost_per_bulk: formData.final_cost_per_bulk ?? null,
              }}
              bulkQuantityEquivalence={productPresentation.bulk_quantity_equivalence ?? null}
              sellUnit={productPresentation.sell_unit ?? null}
              presentationName={productPresentation.product_presentation_name ?? null}
            />
          </div>
        </div>

        <DialogFooter className="mt-auto translate-y-6 sticky bottom-0 right-0 bg-white border-t border-t-gray-200 py-4">
          <DialogClose asChild>
            <Button variant="outline" disabled={mutation.isLoading}>Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={mutation.isLoading}>
            {mutation.isLoading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

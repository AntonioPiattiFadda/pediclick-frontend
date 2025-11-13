"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { Price } from "@/types/prices";
import type { Store } from "@/types/stores";
import ManageProductPrices from "./ManageProductPricesTabs";
import CostBadges from "./CostBadges";

type Props = {
    productPrices: Price[];
    stores: Store[];
    finalCost: {
        final_cost_total: number | null;
        final_cost_per_unit: number | null;
        final_cost_per_bulk: number | null;
    };
    productPresentationId: number;
};

export default function ProductPricesViewer({ productPrices, finalCost, stores, productPresentationId }: Props) {

    const getStoreName = (storeId: number | null) => {
        if (!storeId) return "Universal (todas)";
        const store = stores.find((s) => s.store_id === storeId);
        return store ? store.store_name : "Desconocida";
    };

    if (productPrices.length === 0) {
        return (
            <Card className="border-none shadow-none">
                <CardContent className="p-0">
                    <div className=" flex flex-col gap-2 items-center  justify-center py-4 text-muted-foreground">
                        No hay precios registrados para este producto.
                        <ManageProductPrices
                            productPresentationId={productPresentationId!}
                            disabled={false}
                            finalCost={{
                                final_cost_total: finalCost?.final_cost_total || null,
                                final_cost_per_unit: finalCost?.final_cost_per_unit || null,
                                final_cost_per_bulk: finalCost?.final_cost_per_bulk || null,
                            }}
                        />
                    </div>
                </CardContent>
            </Card>
        )
    }

    const sortedPrices = [...productPrices].sort((a, b) => {
        const storeA = a.store_id || 0;
        const storeB = b.store_id || 0;
        return storeA - storeB;
    });

    return (
        <Card className="border-none shadow-none">
            <CardHeader className="p-0  flex flex-row justify-between">
                <div className="flex flex-col gap-2">
                    <CardTitle>Costos del ultimo lote ingresado</CardTitle>
                    <CostBadges finalCost={finalCost} />

                </div>

                <div>
                    <ManageProductPrices
                        productPresentationId={productPresentationId!}
                        disabled={false}
                        finalCost={{
                            final_cost_total: finalCost?.final_cost_total || null,
                            final_cost_per_unit: finalCost?.final_cost_per_unit || null,
                            final_cost_per_bulk: finalCost?.final_cost_per_bulk || null,
                        }}
                    />
                    {/* <Button variant="outline" size="sm" onClick={() => window.print()}>
                        Imprimir precios
                    </Button> */}
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-x-auto rounded-md ">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tienda</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Lógica</TableHead>
                                <TableHead>Cant. por precio</TableHead>
                                <TableHead>Precio total</TableHead>
                                <TableHead>Ganancia %</TableHead>
                                <TableHead>Observaciones</TableHead>
                                <TableHead>Válido desde</TableHead>
                                <TableHead>Válido hasta</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {sortedPrices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                                        No hay precios registrados para este producto.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedPrices.map((price) => (
                                    <TableRow key={price.price_id}>
                                        <TableCell>{getStoreName(price.store_id)}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={price.price_type === "MINOR" ? "default" : "outline"}
                                                className="capitalize"
                                            >
                                                {price.price_type === "MINOR" ? "Minorista" : "Mayorista"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {price.logic_type === "QUANTITY_DISCOUNT"
                                                ? "Por cantidad"
                                                : price.logic_type === "SPECIAL"
                                                    ? "Especial"
                                                    : price.logic_type === "LIMITED_OFFER"
                                                        ? "Oferta limitada"
                                                        : price.logic_type}
                                        </TableCell>
                                        <TableCell>{price.qty_per_price}</TableCell>
                                        <TableCell>${price.price.toFixed(2)}</TableCell>
                                        <TableCell>
                                            {price.profit_percentage !== null
                                                ? `${price.profit_percentage.toFixed(2)}%`
                                                : "--"}
                                        </TableCell>
                                        <TableCell className="max-w-[250px] truncate" title={price.observations ?? ""}>
                                            {price.observations ?? "--"}
                                        </TableCell>
                                        <TableCell>
                                            {price.valid_from ? price.valid_from.split("T")[0] : "--"}
                                        </TableCell>
                                        <TableCell>
                                            {price.valid_until ? price.valid_until.split("T")[0] : "--"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>



            </CardContent>
        </Card>
    );
}

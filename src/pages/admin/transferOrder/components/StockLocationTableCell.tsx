

import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet"
import type { Lot } from "@/types/lots"
import StockLocationTable from "../../../../components/admin/stock/manageStockBtnUNUSED/StockLocationTable"

export function StockLocationTableCell({ lots, productName, disabled = false }: { lots: Lot[], productName: string, disabled?: boolean }) {


    return (
        <div className="flex gap-2 items-center">
            <Sheet open={disabled ? false : undefined}>
                <SheetTrigger asChild>
                    <Button
                        disabled={disabled}
                        variant="outline">Stock total</Button>
                </SheetTrigger>
                <SheetContent side={'bottom'}>
                    <SheetHeader>
                        <SheetTitle>Producto: {productName}</SheetTitle>
                        {/* <SheetDescription>
                        Make changes to your profile here. Click save when you&apos;re done.
                        </SheetDescription> */}
                    </SheetHeader>
                    <StockLocationTable lots={lots} />
                </SheetContent>
            </Sheet>
        </div>
    )
}

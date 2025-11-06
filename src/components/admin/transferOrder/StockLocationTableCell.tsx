

import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet"
import type { Lot } from "@/types/lots"
import StockLocationTable from "../shared/manageStockBtn/StockLocationTable"

export function StockLocationTableCell({ lots, productName, maxQtyInFromLocation }: { lots: Lot[], productName: string, maxQtyInFromLocation: number | null }) {


    return (
        <div className="flex gap-2 items-center">
            <span>{maxQtyInFromLocation}</span>
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline">Stock total</Button>
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

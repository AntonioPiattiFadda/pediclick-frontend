import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ManageProductPricesContainer from '../manageProductPricesContainer';

const PricesAccordion = ({ productId, finalCost }: {
    productId: number | null;
    finalCost?: {
        final_cost_total: number | null;
        final_cost_per_unit: number | null;
        final_cost_per_bulk: number | null;
    };
}) => {
    return (
        <AccordionItem value="prices">
            <AccordionTrigger className="text-sm font-medium">
                Precios
            </AccordionTrigger>
            <AccordionContent>
                <ManageProductPricesContainer
                    productId={productId!}
                    disabled={false}
                    finalCost={{
                        final_cost_total: finalCost?.final_cost_total || null,
                        final_cost_per_unit: finalCost?.final_cost_per_unit || null,
                        final_cost_per_bulk: finalCost?.final_cost_per_bulk || null,
                    }}

                // lotId={lotId}
                // stockId={stockId}
                // lotNumber={lotNumber}
                // loadOrderId={loadOrderId}
                // storeId={storeId}
                />
            </AccordionContent>
        </AccordionItem>
    )
}

export default PricesAccordion
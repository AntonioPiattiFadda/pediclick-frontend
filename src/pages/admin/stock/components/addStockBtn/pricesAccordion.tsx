import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ProductPricesViewerContainer from '../../../../../components/admin/pricesManagement.tsx/ProductPricesViewerContainer';

const PricesAccordion = ({ productPresentationId, finalCost }: {
    productPresentationId: number | null;
    finalCost?: {
        final_cost_total: number | null;
        final_cost_per_unit: number | null;
        final_cost_per_bulk: number | null;
    };
}) => {
    return (
        <AccordionItem disabled={productPresentationId === null} value="prices"
            className={`${productPresentationId === null ? 'opacity-50 pointer-events-none' : ''}`}
        >
            <AccordionTrigger className="text-sm font-medium">
                Precios
            </AccordionTrigger>
            <AccordionContent>
                <ProductPricesViewerContainer
                    productPresentationId={productPresentationId!}
                    finalCost={{
                        final_cost_total: finalCost?.final_cost_total || null,
                        final_cost_per_unit: finalCost?.final_cost_per_unit || null,
                        final_cost_per_bulk: finalCost?.final_cost_per_bulk || null,
                    }}
                />
            </AccordionContent>
        </AccordionItem>
    )
}

export default PricesAccordion
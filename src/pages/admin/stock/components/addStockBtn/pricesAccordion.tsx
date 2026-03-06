import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ProductPricesViewerContainer from '../../../../../components/admin/pricesManagement.tsx/ProductPricesViewerContainer';

const PricesAccordion = ({ productPresentationId, finalCost, bulkQuantityEquivalence, sellUnit, presentationName }: {
    productPresentationId: number | null;
    finalCost?: {
        final_cost_total: number | null;
        final_cost_per_unit: number | null;
        final_cost_per_bulk: number | null;
    };
    bulkQuantityEquivalence?: number | null;
    sellUnit?: 'BY_UNIT' | 'BY_WEIGHT' | null;
    presentationName?: string | null;
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
                    bulkQuantityEquivalence={bulkQuantityEquivalence}
                    sellUnit={sellUnit}
                    presentationName={presentationName}
                />
            </AccordionContent>
        </AccordionItem>
    )
}

export default PricesAccordion
import type { ProductPresentation } from "@/types/productPresentation"

const Transformation = ({ fromProductPresentationId }:
    {
        fromProductPresentationId: ProductPresentation | null
    }) => {
    return (
        <div>{fromProductPresentationId?.product_presentation_name}</div>
    )
}

export default Transformation
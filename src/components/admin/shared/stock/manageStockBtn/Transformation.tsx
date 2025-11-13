import type { ProductPresentation } from "@/types/product_presentation"

const Transformation = ({ fromProductPresentationId }:
    {
        fromProductPresentationId: ProductPresentation | null
    }) => {
    return (
        <div>{fromProductPresentationId?.product_presentation_name}</div>
    )
}

export default Transformation
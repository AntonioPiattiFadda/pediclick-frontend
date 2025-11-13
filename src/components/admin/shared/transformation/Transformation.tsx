

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { SidebarMenuButton } from "@/components/ui/sidebar"
import type { Transformation } from "@/types/transformation"
import type { TransformationDetail } from "@/types/transformationDetails"
import { PlusCircle, Trash } from "lucide-react"
import { useState } from "react"
import ProductSelector from "../selectors/productSelector"
import type { Product } from "@/types/products"
import { CreateProductPresentation, ProductPresentationSelectorRoot, SelectProductPresentation } from "../selectors/productPresentationSelector"

const generateNewTransformationDetail = (isOrigin: boolean, newTransformationId: number) => {
    return {
        transformation_detail_id: Math.random(),
        transformation_id: newTransformationId,
        lot_id: null,
        product_id: null,
        is_origin: isOrigin,
        product_presentation_id: null,
        quantity: 0,
        product: null,
        product_presentation: null,
    }
}



export function Transformation() {
    const newTransformationId = Math.floor(Math.random() * 1000000);

    const initialFromTranformationDetails: TransformationDetail = generateNewTransformationDetail(true, newTransformationId);

    const initialToTranformationDetails: TransformationDetail = generateNewTransformationDetail(false, newTransformationId);

    const [fromTransformationDetails, setFromTransformationDetails] = useState<TransformationDetail[]>([
        { ...initialFromTranformationDetails }
    ])

    console.log(fromTransformationDetails);

    const [transformation, setTransformation] = useState<Transformation>({
        transformation_id: newTransformationId,
        transformation_date: new Date().toISOString().split('T')[0],
        transformation_cost: 0,
        notes: "",
    } as Transformation)

    const [toTransformationDetails, setToTransformationDetails] = useState<TransformationDetail[]>([
        {
            ...initialToTranformationDetails
        }
    ])

    const showFromTrash = fromTransformationDetails.length > 1;
    const showToTrash = toTransformationDetails.length > 1;

    console.log(showToTrash, setToTransformationDetails);

    return (
        <Dialog>
            <form>
                <DialogTrigger asChild>
                    <SidebarMenuButton>Transformacion</SidebarMenuButton>
                </DialogTrigger>
                <DialogContent className="">
                    <DialogHeader>
                        <DialogTitle>Transformacion</DialogTitle>
                        <DialogDescription>
                            Realiza transformaciones de productos aquí.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-2">

                        <div className="flex flex-col gap-2">

                            {fromTransformationDetails.map((td) => (
                                <div
                                    key={td.transformation_detail_id}
                                >
                                    <ProductSelector
                                        value={td.product ?? {} as Product}
                                        onChange={
                                            (product: Product) => {
                                                const productIndex = fromTransformationDetails.findIndex((item) => item.transformation_detail_id === td.transformation_detail_id);
                                                const updatedDetails = [...fromTransformationDetails];
                                                updatedDetails[productIndex] = {
                                                    ...updatedDetails[productIndex],
                                                    product_id: product?.product_id || null,
                                                    product: product,
                                                };
                                                setFromTransformationDetails(updatedDetails);

                                            }}
                                    />

                                    <ProductPresentationSelectorRoot
                                        productId={td.product_id}
                                        value={td.product_presentation}
                                        onChange={(presentation) => {
                                            const fromTransformationDetailIndex = fromTransformationDetails.findIndex((item) => item.transformation_detail_id === td.transformation_detail_id);

                                            const updatedFromTransformationDetails = [...fromTransformationDetails];
                                            updatedFromTransformationDetails[fromTransformationDetailIndex] = {
                                                ...updatedFromTransformationDetails[fromTransformationDetailIndex],
                                                product_presentation_id: presentation?.product_presentation_id ?? null,
                                                product_presentation: presentation,
                                            };

                                            setFromTransformationDetails(updatedFromTransformationDetails);

                                        }}
                                    >
                                        <SelectProductPresentation />
                                        <CreateProductPresentation />
                                    </ProductPresentationSelectorRoot>

                                    <span>{td.product_presentation_id} {td.product_presentation?.lots?.map(lot => lot.stock).join(', ')}</span>
                                    <span>{td.lot_id}</span>
                                    <Input value={td.quantity} onChange={(e) => {
                                        setFromTransformationDetails((prev) => prev.map((item) => item.transformation_detail_id === td.transformation_detail_id ? { ...item, quantity: Number((e.target as HTMLInputElement).value) } : item));
                                    }} />

                                    {showFromTrash && (
                                        <Button
                                            variant="outline"
                                            size={'icon'}
                                            onClick={() => {
                                                setFromTransformationDetails((prev) =>
                                                    prev.filter((item) => item.transformation_detail_id !== td.transformation_detail_id)
                                                );
                                            }}>
                                            <Trash size={16} />
                                        </Button>
                                    )}
                                </div>
                            ))}

                            <Button variant="outline" size={'icon'} onClick={() => {
                                setFromTransformationDetails((prev) => [...prev, generateNewTransformationDetail(true, newTransformationId)]);
                            }}>
                                <PlusCircle size={16} />
                            </Button>

                        </div>

                        <div className="bg-green-200">
                            <Input value={transformation.transformation_cost} onChange={(e) => {
                                setTransformation((prev) => ({ ...prev, transformation_cost: Number((e.target as HTMLInputElement).value) }));
                            }} />
                            <Input value={transformation.notes} onChange={(e) => {
                                setTransformation((prev) => ({ ...prev, notes: (e.target as HTMLInputElement).value }));
                            }} />
                        </div>

                        <div className="bg-red-200"></div>

                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </form>
        </Dialog >
    )
}

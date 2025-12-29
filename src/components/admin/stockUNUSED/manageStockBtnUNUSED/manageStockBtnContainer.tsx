import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogTrigger
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { getProductPresentation } from "@/service/productPresentations";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { ManageStockBtn } from "./manageStockBtn";


export function ManageStockBtnContainer({
    productPresentationId,
}: {
    productPresentationId: number;
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: productPresentation, isLoading, isError } = useQuery({
        queryKey: ["product-presentation", productPresentationId],
        queryFn: async () => {
            const response = await getProductPresentation(productPresentationId);
            return response.presentation;
        },
        enabled: isModalOpen && !!productPresentationId,
    });



    return (<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
            <Button variant="ghost">
                <ChevronRight className=" h-4 w-4" />

            </Button>
        </DialogTrigger>
        <DialogContent
            className={`border-4 border-transparent  flex  flex-col gap-2 w-[1050px] overflow-y-auto max-h-[90vh] min-h-[500px]`}
        >
            {isLoading ? (
                <div className="w-full h-[500px] flex items-center justify-center">
                    <Spinner />
                </div>
            ) : productPresentation ? (
                <ManageStockBtn
                    productPresentation={productPresentation}
                />
            ) : (
                isError && <span>Error loading product data.</span>
            )}
        </DialogContent>
    </Dialog>);
}

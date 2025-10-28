import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogTrigger
} from "@/components/ui/dialog";
import { getProduct } from "@/service/products";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { ManageStockBtn } from "./manageStockBtn";


export function ManageStockBtnContainer({
    productId,
}: {
    productId: number;
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: product, isLoading, isError } = useQuery({
        queryKey: ["product", productId],
        queryFn: async () => {
            const response = await getProduct(productId);
            return response.product;
        },
        enabled: isModalOpen && !!productId,
    });

    console.log({ product, isLoading, isError });



    if (isLoading) {
        return <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost">
                    <ChevronRight />
                </Button>
            </DialogTrigger>
            <DialogContent
                className={`border-4 border-transparent  flex  flex-col gap-2 w-[750px] overflow-y-auto max-h-[90vh] min-h-[500px]`}
            ></DialogContent>
        </Dialog>
    }

    if (isError) {
        return (
            <span>Error loading product data.</span>
        );
    }


    return (
        <ManageStockBtn product={product} open={isModalOpen} onOpenChange={setIsModalOpen} />
    );
}

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
import { Spinner } from "@/components/ui/spinner";


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
            ) : product ? (
                <ManageStockBtn
                    product={product}
                />
            ) : (
                isError && <span>Error loading product data.</span>
            )}
        </DialogContent>
    </Dialog>);
}

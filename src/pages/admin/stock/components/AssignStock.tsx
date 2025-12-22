import { Button } from "@/components/ui/button";
import type { Stock } from "@/types/stocks";
import { Link } from "lucide-react";

const AssignStock = ({ stock }: {
    stock: Stock;
}) => {


    return (
        <Button size={'icon'} variant={'ghost'}><Link /></Button>

    )
}

export default AssignStock
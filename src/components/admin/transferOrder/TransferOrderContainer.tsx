import TableSkl from "@/components/admin/stock/ui/tableSkl";
import { getTransferOrder } from "@/service/transferOrders";
import { useQuery } from "@tanstack/react-query";
import TransferOrder from "./TransferOrder";
import { useLocation } from "react-router-dom";

const TransferOrderContainer = () => {

    const location = useLocation();
    const transferOrderId = Number(location.pathname.split("/").pop() || "0");

    const {
        data: transferOrder,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["transfer-order", transferOrderId],
        queryFn: async () => {
            const response = await getTransferOrder(transferOrderId);
            return response.dbTransferOrder;
        },
    });


    if (isLoading)
        return (
            <div className="space-y-6">
                <TableSkl />
            </div>
        );
    if (isError || !transferOrder)
        return <div className="pt-14">Error al cargar la transferencia.</div>;


    return (<TransferOrder transferOrder={transferOrder} transferOrderId={transferOrderId} />

    );
};

export default TransferOrderContainer;

import { TransferOrdersContainer } from "@/components/admin/transferOrders.tsx/TransferOrdersContainer";
const TransferOrders = () => {
    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">
                    Gestión de tus ordenes de transferencia
                </h1>
                <p className="text-muted-foreground">Administra tus ordenes de transferencia</p>
            </div>
            <TransferOrdersContainer />
        </div>
    );
};

export default TransferOrders;

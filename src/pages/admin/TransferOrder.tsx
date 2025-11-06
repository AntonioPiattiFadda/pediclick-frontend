import TransferOrderContainer from "@/components/admin/transferOrder/TransferOrderContainer";
const TransferOrder = () => {
    return (
        <div className="space-y-6 p-6">
            {/* <div>
                <h1 className="text-3xl font-bold text-foreground">
                    Gestión
                </h1>
                <p className="text-muted-foreground">Administra tu orden de trasnferencia</p>
            </div> */}
            <TransferOrderContainer />
        </div>
    );
};

export default TransferOrder;

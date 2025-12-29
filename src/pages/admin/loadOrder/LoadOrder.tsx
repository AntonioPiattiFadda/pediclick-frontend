import LoadOrderContainer from "@/pages/admin/loadOrder/components/loadOrderContainer";


const LoadOrder = () => {
    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">
                    Gestión de tu remitos
                </h1>
                <p className="text-muted-foreground">Administra tu remito</p>
            </div>
            <LoadOrderContainer />
        </div>
    );
};

export default LoadOrder;

import { LotContainersContainer } from "@/components/admin/lotContainers/lotContainersContainer";

const LotContainers = () => {
    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Gestión de vacios</h1>
                <p className="text-muted-foreground">Administra tus vacios</p>
            </div>
            <LotContainersContainer />
        </div>
    );
};

export default LotContainers;
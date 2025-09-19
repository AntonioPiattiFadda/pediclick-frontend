import { ClientsContainer } from "@/components/admin/clients/ClientsContainer";

const Clients = () => {
    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Gestión de clientes</h1>
                <p className="text-muted-foreground">Administra tus clientes</p>
            </div>
            <ClientsContainer />
        </div>
    );
};

export default Clients;
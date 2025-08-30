import { LoadOrderContainer } from "@/components/admin/load-orders/LoadOrderContainer";

const LoadOrders = () => {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Gestión de tus personal
        </h1>
        <p className="text-muted-foreground">Administra tu personal</p>
      </div>
      <LoadOrderContainer/>
    </div>
  );
};

export default LoadOrders;

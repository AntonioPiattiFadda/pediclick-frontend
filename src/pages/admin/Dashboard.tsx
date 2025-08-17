import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatsCards } from "@/components/admin/dashboard/StatsCards";
import { SalesChart } from "@/components/admin/dashboard/SalesChart";
import { TopProductsChart } from "@/components/admin/dashboard/TopProductsChart";
import { CategoriesChart } from "@/components/admin/dashboard/CategoriesChart";
import { LowStockTable } from "@/components/admin/dashboard/LowStockTable";
import { useAppSelector } from "@/hooks/useUserData";
import EmployeeDashboard from "./EmployeeDashboard";

const Dashboard = () => {
  const { role } = useAppSelector((state) => state.user);

  console.log(role);

  if (role === "EMPLOYEE") {
    return <EmployeeDashboard/>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl  font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen de las métricas clave de tu negocio
        </p>
      </div>

      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ventas Diarias</CardTitle>
            <CardDescription>Ingresos de los últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            <SalesChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
            <CardDescription>Top 10 productos del mes</CardDescription>
          </CardHeader>
          <CardContent>
            <TopProductsChart />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Distribución por Categorías</CardTitle>
            <CardDescription>Productos por categoría</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoriesChart />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Stock Bajo</CardTitle>
            <CardDescription>
              Productos que requieren reabastecimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LowStockTable />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

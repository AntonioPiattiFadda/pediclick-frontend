import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { getCategoriesCount } from '@/service/categories';
import { getDailySalesLast30Days } from '@/service/orders';
import { getProductCount } from '@/service/products';
import { formatCurrency } from '@/utils/prices';
import { useQuery } from '@tanstack/react-query';
import { ArrowUp, Package, ShoppingCart } from 'lucide-react';

export const StatsCards = () => {

  const { data: sales,
    isLoading,
    isError } = useQuery({
      queryKey: ["last-30-days-sales"],
      queryFn: () => getDailySalesLast30Days(),
    });

  const { data: productsCount,
    isLoading: isLoadingProducts,
    isError: isErrorProducts
  } = useQuery({
    queryKey: ["products-count"],
    queryFn: () => getProductCount(),
  });

  const { data: categoriesCount,
    isLoading: isLoadingCategories,
    isError: isErrorCategories
  } = useQuery({
    queryKey: ["categories-count"],
    queryFn: () => getCategoriesCount(),
  });


  if (isLoading || isLoadingProducts || isLoadingCategories) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="animate-slide-in h-40 flex items-center justify-center">
        <Spinner />
      </Card>
      <Card className="animate-slide-in h-40 flex items-center justify-center">
        <Spinner />
      </Card>
      <Card className="animate-slide-in h-40 flex items-center justify-center">
        <Spinner />
      </Card>


    </div >
  }

  if (isError || isErrorProducts || isErrorCategories) {
    return <div>Error loading sales data.</div>;
  }

  const totalMonthSales = sales.reduce((acc, curr) => acc + curr.sales, 0);


  const stats = [
    {
      title: 'Ventas del Mes',
      value: formatCurrency(totalMonthSales),
      change: '+20.1%',
      trend: 'up',
      icon: ShoppingCart,
      description: 'vs mes anterior',
    },
    {
      title: 'Productos Activos',
      value: productsCount,
      change: '+180',
      trend: 'up',
      icon: Package,
      description: 'nuevos este mes',
    },
    // {
    //   title: 'Stock Bajo',
    //   value: '23',
    //   change: '-5',
    //   trend: 'down',
    //   icon: ArrowDown,
    //   description: 'productos críticos',
    // },
    {
      title: 'Categorías',
      value: categoriesCount,
      change: '+2',
      trend: 'up',
      icon: ArrowUp,
      description: 'categorías activas',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="animate-slide-in h-40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span
                className={`flex items-center gap-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}
              >
                {/* {stat.trend === 'up' ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                {stat.change} */}
              </span>
              {/* <span>{stat.description}</span> */}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

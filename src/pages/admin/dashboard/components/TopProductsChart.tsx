import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Spinner } from '@/components/ui/spinner';
import { getMostSoldProducts } from '@/service/orderItems';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';

const topProducts = [
  { name: 'Laptop Gaming', sales: 125 },
  { name: 'Smartphone Pro', sales: 98 },
  { name: 'Tablet 10"', sales: 87 },
  { name: 'Auriculares BT', sales: 76 },
  { name: 'Monitor 4K', sales: 65 },
  { name: 'Teclado Mecánico', sales: 54 },
  { name: 'Mouse Gaming', sales: 43 },
  { name: 'Webcam HD', sales: 32 },
];

const chartConfig = {
  sales: {
    label: "Ventas",
    color: "hsl(var(--accent))",
  },
};

export const TopProductsChart = () => {

  const { data: mostSoldProducts,
    isLoading: isLoadingMostSoldProducts,
    isError: isErrorMostSoldProducts
  } = useQuery({
    queryKey: ["most-sold-products"],
    queryFn: () => getMostSoldProducts(),
  });

  console.log("mostSoldProducts", mostSoldProducts);

  if (isLoadingMostSoldProducts) {
    return <div className='w-full  h-60 flex items-center justify-center'>
      <Spinner />
    </div>;
  }
  if (isErrorMostSoldProducts) {
    return <div>Error loading sales data.</div>;
  }


  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <BarChart data={topProducts}>
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="sales"
          fill="#29a847"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
};
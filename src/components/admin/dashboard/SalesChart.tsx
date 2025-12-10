import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { getDailySalesLast30Days } from '@/service/orders';
import { useQuery } from '@tanstack/react-query';
import { Line, LineChart, XAxis, YAxis } from 'recharts';


const chartConfig = {
  sales: {
    label: "Ventas ($)",
    color: "hsl(var(--primary))",
  },
};



export const SalesChart = () => {

  const { data: sales,
    isLoading,
    isError } = useQuery({
      queryKey: ["last-30-days-sales"],
      queryFn: () => getDailySalesLast30Days(),
    });



  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading sales data.</div>;
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <LineChart data={sales}>
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="sales"
          type="monotone"
          stroke="#1c7bfa"
          strokeWidth={2}
          dot={false}
          fill="#1c7bfa"
          fillOpacity={0.1}
        />
      </LineChart>
    </ChartContainer>
  );
};

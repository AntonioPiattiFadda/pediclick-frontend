import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
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
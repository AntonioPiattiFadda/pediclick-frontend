import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, XAxis, YAxis } from 'recharts';

const generateSalesData = () => {
  const data = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
      sales: Math.floor(Math.random() * 2000) + 500,
    });
  }
  
  return data;
};

const chartConfig = {
  sales: {
    label: "Ventas ($)",
    color: "hsl(var(--primary))",
  },
};

export const SalesChart = () => {
  const data = generateSalesData();

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <LineChart data={data}>
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

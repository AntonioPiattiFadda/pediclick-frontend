import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { getProductCountByCategory } from '@/service/products';
import { useQuery } from '@tanstack/react-query';
import { Cell, Pie, PieChart } from 'recharts';

export const CategoriesChart = () => {

  const { data: productsCountByCategory,
    isLoading,
    isError } = useQuery({
      queryKey: ["product-count-by-category"],
      queryFn: () => getProductCountByCategory(),
    });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading sales data.</div>;
  }

  const chartConfig = productsCountByCategory.reduce((acc: Record<string, { label: string; color: string }>, entry) => {
    acc[entry.name] = {
      label: entry.name,
      color: entry.color,
    };
    return acc;
  }, {});

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <PieChart>
        <Pie
          data={productsCountByCategory}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          dataKey="count"
        >
          {productsCountByCategory.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
      </PieChart>
    </ChartContainer>
  );
};

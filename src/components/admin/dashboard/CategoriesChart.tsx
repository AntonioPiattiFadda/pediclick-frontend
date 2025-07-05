import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const categories = [
  { name: 'Electrónicos', count: 450, color: 'hsl(var(--primary))' },
  { name: 'Ropa', count: 320, color: 'hsl(var(--accent))' },
  { name: 'Hogar', count: 280, color: 'hsl(214, 95%, 68%)' },
  { name: 'Deportes', count: 180, color: 'hsl(134, 61%, 51%)' },
  { name: 'Libros', count: 120, color: 'hsl(var(--muted))' },
];

const chartConfig = {
  count: {
    label: "Productos",
  },
  electronics: {
    label: "Electrónicos",
    color: "hsl(var(--primary))",
  },
  clothing: {
    label: "Ropa",
    color: "hsl(var(--accent))",
  },
  home: {
    label: "Hogar",
    color: "hsl(214, 95%, 68%)",
  },
  sports: {
    label: "Deportes",
    color: "hsl(134, 61%, 51%)",
  },
  books: {
    label: "Libros",
    color: "hsl(var(--muted))",
  },
};

export const CategoriesChart = () => {
  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <PieChart>
        <Pie
          data={categories}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          dataKey="count"
        >
          {categories.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
      </PieChart>
    </ChartContainer>
  );
};

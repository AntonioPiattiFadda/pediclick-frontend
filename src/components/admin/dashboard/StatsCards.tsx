import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Package, ShoppingCart } from 'lucide-react';

const stats = [
  {
    title: 'Ventas del Mes',
    value: '$45,231',
    change: '+20.1%',
    trend: 'up',
    icon: ShoppingCart,
    description: 'vs mes anterior',
  },
  {
    title: 'Productos Activos',
    value: '2,350',
    change: '+180',
    trend: 'up',
    icon: Package,
    description: 'nuevos este mes',
  },
  {
    title: 'Stock Bajo',
    value: '23',
    change: '-5',
    trend: 'down',
    icon: ArrowDown,
    description: 'productos críticos',
  },
  {
    title: 'Categorías',
    value: '12',
    change: '+2',
    trend: 'up',
    icon: ArrowUp,
    description: 'categorías activas',
  },
];

export const StatsCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="animate-slide-in">
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
                className={`flex items-center gap-1 ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stat.trend === 'up' ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                {stat.change}
              </span>
              <span>{stat.description}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

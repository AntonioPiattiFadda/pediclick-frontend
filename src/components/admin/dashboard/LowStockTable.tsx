import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

const lowStockProducts = [
  {
    id: 1,
    name: 'Laptop Gaming MSI',
    sku: 'LG-MSI-001',
    category: 'Electrónicos',
    currentStock: 3,
    minStock: 10,
    status: 'critical',
  },
  {
    id: 2,
    name: 'iPhone 15 Pro',
    sku: 'IP-15P-001',
    category: 'Smartphones',
    currentStock: 5,
    minStock: 15,
    status: 'low',
  },
  {
    id: 3,
    name: 'AirPods Pro',
    sku: 'AP-PRO-001',
    category: 'Audio',
    currentStock: 2,
    minStock: 8,
    status: 'critical',
  },
  {
    id: 4,
    name: 'MacBook Air M2',
    sku: 'MBA-M2-001',
    category: 'Laptops',
    currentStock: 4,
    minStock: 12,
    status: 'low',
  },
];

export const LowStockTable = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'destructive';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-center">Stock Actual</TableHead>
            <TableHead className="text-center">Stock Mínimo</TableHead>
            <TableHead className="text-center">Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lowStockProducts.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center">
                    <Package className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.sku}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell className="text-center font-medium">
                {product.currentStock}
              </TableCell>
              <TableCell className="text-center">{product.minStock}</TableCell>
              <TableCell className="text-center">
                <Badge variant={getStatusColor(product.status)}>
                  {product.status === 'critical' ? 'Crítico' : 'Bajo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline">
                  Reabastecer
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

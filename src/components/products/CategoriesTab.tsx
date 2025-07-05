import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Search } from 'lucide-react';
import { CategoriesTable } from './CategoriesTable';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/service';
import TableSkl from './ui/tableSkl';

export const CategoriesTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  
   const { data: categories, isLoading } = useQuery({
      queryKey: ["categories"],
      queryFn: async () => {
        const response = await getCategories();
        return response.categories;
      },
    });

   
  if (isLoading) {
    return <TableSkl />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Categorías</CardTitle>
              <CardDescription>
                Organiza tus productos en categorías
              </CardDescription>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nueva Categoría
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar categorías..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activa</SelectItem>
                <SelectItem value="inactive">Inactiva</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <CategoriesTable categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
};

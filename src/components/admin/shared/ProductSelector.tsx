/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import {
  Dialog,
  // DialogContent,
  // DialogDescription,
  // DialogFooter,
  // DialogHeader,
  // DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Product } from "@/types";
import { Trash2 } from "lucide-react";
import { AddProductBtn } from "../stock/addEditProduct/AddProductBtn";
import { useState } from "react";

interface ProductSelectProps {
  products: Product[];
  isLoading: boolean;
  value: string;
  onChange: (id: string) => void;
}

export function ProductSelector({
  products,
  // isLoading,
  value,
  onChange,
}: ProductSelectProps) {
  const [open, setOpen] = useState(false);

  //TODO: POP UP CREACION DE PRODUCTO

  return (
    <div className="flex items-center gap-2 w-full">
      <select
        className="w-full border rounded px-2 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Sin elemento</option>
        {products.map((cat) => (
          <option key={cat.product_id} value={cat.product_id}>
            {cat.product_name}
          </option>
        ))}
      </select>

      {/* Si hay selección, mostrar tacho */}
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange("")}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      )}

      {/* Botón para crear nueva categoría */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <AddProductBtn shortAddBtn={true} />
        </DialogTrigger>
      </Dialog>
    </div>
  );
}

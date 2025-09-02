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
import type { Product } from "@/types/products";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AddProductBtn } from "../stock/addEditProduct/AddProductBtn";

import { Input } from "@/components/ui/input";
import { getProductsByName, getProductsByShortCode } from "@/service/products";
import { useQuery } from "@tanstack/react-query";


interface ProductSelectProps {
  products: Product[]; // se conserva para no romper, no se usa acá
  isLoading: boolean; // se conserva para no romper, no se usa acá
  value: string; // product_id seleccionado
  onChange: (id: string) => void;
}

function useDebounce<T>(value: T, delay = 500) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function ProductSelector({
  products: _unused,
  isLoading: _unusedLoading,
  value,
  onChange,
}: ProductSelectProps) {
  const [open, setOpen] = useState(false);
  const [codeQ, setCodeQ] = useState("");
  const [nameQ, setNameQ] = useState("");

  const dCode = useDebounce(codeQ, 500);
  const dName = useDebounce(nameQ, 500);

  // Coincidencias por short_code
  const {
    data: codeData,
    isFetching: fetchingCode,
    isError: errorCode,
  } = useQuery({
    queryKey: ["products:shortCodeLike", dCode],
    queryFn: () => getProductsByShortCode(dCode),
    enabled: dCode.trim().length > 0,
    staleTime: 0,
  });

  // Coincidencias por product_name
  const {
    data: nameData,
    isFetching: fetchingName,
    isError: errorName,
  } = useQuery({
    queryKey: ["products:nameLike", dName],
    queryFn: () => getProductsByName(dName),
    enabled: dName.trim().length > 0,
    staleTime: 0,
  });

  const codeOptions: Product[] = codeData?.products ?? [];
  const nameOptions: Product[] = nameData?.products ?? [];

  // Helpers para “selección controlada” en cada select:
  const codeHasValue = codeOptions.some(
    (p: any) => String(p.product_id) === String(value)
  );
  const nameHasValue = nameOptions.some(
    (p: any) => String(p.product_id) === String(value)
  );
  const codeSelectValue = codeHasValue ? value : "";
  const nameSelectValue = nameHasValue ? value : "";

console.log(codeData, nameData);
console.log(nameQ)

  return (
    <div className="w-full space-y-3">
      {/* Buscadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Input
            placeholder="Buscar por codigo"
            value={codeQ}
            onChange={(e) => setCodeQ(e.target.value)}
          />
          {/* Select con coincidencias por código */}
          {dCode && (
            <select
              className="w-full border rounded px-2 py-2"
              value={codeSelectValue}
              onChange={(e) => onChange(e.target.value)}
              disabled={fetchingCode || errorCode}
            >
              <option value="">
                {fetchingCode
                  ? "Buscando…"
                  : errorCode
                  ? "Error"
                  : "Elegí un producto por código"}
              </option>
              {codeOptions.map((p: any) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.short_code ?? "—"} — {p.product_name ?? "—"}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-1">
          <Input
            placeholder="Buscar por nombre"
            value={nameQ}
            onChange={(e) => setNameQ(e.target.value)}
          />
          {/* Select con coincidencias por nombre */}
          {dName && (
            <select
              className="w-full border rounded px-2 py-2"
              value={nameSelectValue}
              onChange={(e) => onChange(e.target.value)}
              disabled={fetchingName || errorName}
            >
              <option value="">
                {fetchingName
                  ? "Buscando…"
                  : errorName
                  ? "Error"
                  : "Elegí un producto por nombre"}
              </option>
              {nameOptions.map((p: any) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_name ?? "—"} — {p.short_code ?? "—"}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

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

      {/* Botón para crear nuevo producto */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <AddProductBtn shortAddBtn={true} />
        </DialogTrigger>
      </Dialog>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/hooks/useUserData";
import {
  createProduct,
  getProductsByName,
  getProductsByShortCode,
} from "@/service/products";
import type { Product } from "@/types/products";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { emptyProduct } from "../stock/addEditProduct/emptyFormData";

interface ProductSelectProps {
  value: number;
  onChange: (product: Product) => void;
}

function useDebounce<T>(value: T, delay = 500) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function ProductSelector({ value, onChange }: ProductSelectProps) {
  const [codeQ, setCodeQ] = useState("");
  const [nameQ, setNameQ] = useState("");

  const dCode = useDebounce(codeQ, 500);

  const dName = useDebounce(nameQ, 500);

  const { role } = useAppSelector((state) => state.user);

  // Coincidencias por short_code
  const {
    data: codeData,
    isFetching: fetchingCode,
    isError: errorCode,
  } = useQuery({
    queryKey: ["products:shortCodeLike"],
    queryFn: () => getProductsByShortCode(dCode, role),
    enabled: dCode.trim().length > 0,
  });

  // Coincidencias por product_name
  const {
    data: nameData,
    isFetching: fetchingName,
    isError: errorName,
  } = useQuery({
    queryKey: ["products:nameLike"],
    queryFn: () => getProductsByName(dName, role),
    enabled: dName.trim().length > 0,
  });

  const [searchedProducts, setSearchedProducts] = useState<Product[]>([]);

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

  return (
    <div className="w-full space-y-3">
      {/* Buscadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Input
            placeholder="Código Corto"
            value={codeQ}
            onChange={(e) => setCodeQ(e.target.value)}
          />
          {/* Select con coincidencias por código */}
          {dCode && (
            <select
              className="w-full border rounded px-2 py-2"
              value={codeSelectValue}
              // onChange={(e) => onChange(e.target.value)}
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
            placeholder="Nombre"
            value={nameQ}
            onChange={(e) => setNameQ(e.target.value)}
          />
          {/* Select con coincidencias por nombre */}
          {dName && nameOptions.length > 0 && (
            <select
              className="w-full border rounded px-2 py-2"
              value={nameSelectValue}
              // onChange={(e) => onChange(e.target.value)}
              disabled={fetchingName || errorName}
            >
              {nameOptions.map((p: any) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_name ?? "—"} — {p.short_code ?? "—"}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {nameOptions.length === 0 && nameQ && dName ? (
        <Button
          onClick={() =>
            createProduct({ ...emptyProduct, product_name: nameQ })
          }
        >
          Crear {dName}
        </Button>
      ) : null}

      {/* Si hay selección, mostrar tacho */}
      {/* {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange("")}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      )} */}

      {/* Botón para crear nuevo producto */}
      {/* <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <AddProductBtn shortAddBtn={true} />
        </DialogTrigger>
      </Dialog> */}
    </div>
  );
}

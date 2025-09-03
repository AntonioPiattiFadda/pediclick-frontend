import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger } from "@radix-ui/react-dialog";
import { useState } from "react";

// function useDebounce<T>(value: T, delay = 500) {
//   const [debounced, setDebounced] = useState(value);
//   useEffect(() => {
//     const id = setTimeout(() => setDebounced(value), delay);
//     return () => clearTimeout(id);
//   }, [value, delay]);
//   return debounced;
// }

export const ReceptorSearcher = () => {
  const [open, setOpen] = useState(false);
  //   const [name, setName] = useState("");

  //   const dName = useDebounce(dName, 500);

  //   const {
  //     data: codeData,
  //     isFetching: fetchingCode,
  //     isError: errorCode,
  //   } = useQuery({
  //     queryKey: ["products:shortCodeLike", dCode],
  //     queryFn: () => getProductsByShortCode(dCode),
  //     enabled: dName.trim().length > 0,
  //     staleTime: 0,
  //   });

  return (
    <div className="w-full space-y-3">
      {/* Buscadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Input placeholder="Buscar por codigo" />
          {/* Select con coincidencias por código */}
          {/* {dCode && (
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
          )} */}
        </div>
      </div>

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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild></DialogTrigger>
      </Dialog>
    </div>
  );
};

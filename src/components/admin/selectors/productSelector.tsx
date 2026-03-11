/* eslint-disable @typescript-eslint/no-explicit-any */
import { adaptProductForDb } from "@/adapters/products";
import { createProduct, getNextProductShortCode, getProductsByName } from "@/service/products";
import type { Product } from "@/types/products";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { debounce } from "lodash";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import { emptyProduct } from "../emptyFormData";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import ShortCodeSelector from "../stock/shortCodeSelector";

const PRODUCT_CHARACTER_LIMIT = 60;

const ProductSelector = ({
  disabled,
  value,
  onChange,
  withLots = false
}: {
  value: Pick<Product, "product_id" | "product_name" | "short_code" | 'updated_at'>;
  disabled?: boolean;
  onChange: (value: Product) => void;
  withLots?: boolean;
}) => {

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value.product_name || "");
  const [shortCode, setShortCode] = useState<number | null>(value.short_code || null);
  const [options, setOptions] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newShortCode, setNewShortCode] = useState<number | null>(null);
  const [shortCodeStatus, setShortCodeStatus] = useState<"idle" | "loading" | "available" | "unavailable" | "error">("idle");
  const comboboxRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { data: suggestedShortCode, isLoading: isLoadingSuggestion } = useQuery({
    queryKey: ["nextProductShortCode"],
    queryFn: getNextProductShortCode,
    enabled: isCreating,
    staleTime: 0,
  });

  useEffect(() => {
    if (isCreating && suggestedShortCode !== undefined) {
      setNewShortCode(suggestedShortCode);
    }
  }, [isCreating, suggestedShortCode]);


  const fetchProducts = useCallback(
    async (searchValue: string) => {
      if (!searchValue) {
        setOptions([]);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const data = await getProductsByName(searchValue, withLots);

        setOptions(data.products);
      } catch (err) {
        console.error("Error fetching products:", err);
        // setError(err.message || "Failed to fetch products.");
        setOptions([]);
      } finally {
        setIsSearching(false);
      }
    },
    [withLots]
  );

  const fetchProductsByCode = useCallback(
    async (shortCode: number) => {
      if (!shortCode) {
        setOptions([]);
        return;
      }
      setIsSearching(true);
      setError(null);
      try {
        const data = await getProductsByName(shortCode.toString(), withLots);

        if (data.products.length === 1) {
          onChange(data.products[0]);
          setIsOpen(false);
          setInputValue("");
          setIsSearching(false);
          return;
        } else {
          setIsSearching(false);
          toast("No se encontró ningún producto con el código: " + shortCode, { icon: "⚠️" });
        }

        setOptions(data.products);
      } catch (err) {
        console.error("Error fetching products:", err);
        // setError(err.message || "Failed to fetch products.");
        setOptions([]);
      } finally {
        setIsSearching(false);
      }
    },
    [withLots]
  );

  const debouncedFetchProducts = useMemo(
    () => debounce(fetchProducts, 300),
    [fetchProducts]
  );

  const debouncedFetchProductsByCode = useMemo(
    () => debounce(fetchProductsByCode, 300),
    [fetchProductsByCode]
  );


  useEffect(() => {
    if (shortCode) {
      debouncedFetchProductsByCode(shortCode);
    } else {
      setOptions([]);
    }
  }, [shortCode, debouncedFetchProducts]);

  useEffect(() => {
    if (inputValue) {
      debouncedFetchProducts(inputValue);
    } else {
      setOptions([]);
    }
  }, [inputValue, debouncedFetchProducts]);

  useEffect(() => {
    const handleClickOutside = (event: { target: any }) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: {
    target: { value: SetStateAction<string> };
  }) => {
    if (e.target.value.length > PRODUCT_CHARACTER_LIMIT) {
      toast(`El nombre del producto no puede superar los ${PRODUCT_CHARACTER_LIMIT} caracteres.`);
      return
    }
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  const handleComboboxToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Focus the input field when opening the combobox
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const queryClient = useQueryClient();

  const handleSelectProduct = (newProduct: Product) => {
    onChange(newProduct);
    setShortCode(newProduct.short_code ?? null);
    setIsOpen(false);
    setInputValue("");
    setIsCreating(false);
    setNewShortCode(null);
    setShortCodeStatus("idle");
  };

  const createProductMutation = useMutation({
    mutationFn: async (data: { completedInformation: any }) => {
      console.log("Creating product with data:", data);
      return await createProduct(data.completedInformation);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      console.log(data);
      handleSelectProduct(data);
      // setIsModalOpen(false);
      // toast("Producto creado exitosamente", {
      //   description: "El producto ha sido creado correctamente.",
      //   action: {
      //     label: "Undo",
      //     onClick: () => console.log("Undo"),
      //   },
      // });
      // setFormData(emptyProduct);
    },
    onError: () => {
      toast("Error al crear el producto");
    },
  });

  const handleCreateProduct = (productName: string, shortCodeValue?: number) => {
    const completedInformation = adaptProductForDb({
      ...emptyProduct,
      lot_control: true,
      product_name: productName,
      short_code: shortCodeValue ?? null,
    });

    createProductMutation.mutate({
      completedInformation,
    });
  };

  const handleOpenCreating = () => {
    setIsCreating(true);
    setNewShortCode(suggestedShortCode ?? null);
  };

  const handleCancelCreating = () => {
    setIsCreating(false);
    setNewShortCode(null);
    setShortCodeStatus("idle");
  };

  const isSearchValueNumeric = /^\d+$/.test(inputValue.trim());

  const isSearchExactMatch = options.some(
    (option) =>
      option.product_name.toLowerCase() === inputValue.trim().toLowerCase()
  );

  const productValue = value.short_code ? `${value.short_code} - ${value.product_name}` : value.product_name;

  return (
    <div className="relative w-full  inline-flex  border border-gray-200 rounded-md h-9 " ref={comboboxRef}>

      <div className="flex items-center border-r border-gray-200 shrink-0">
        <span className="px-2 text-xs text-muted-foreground font-medium whitespace-nowrap select-none">Cód.</span>
        <Input
          className={`border-none h-9 w-14 truncate px-1`}
          value={shortCode === null ? "" : String(shortCode)}
          placeholder="---"
          disabled={disabled}
          onChange={(e) => {
            const val = e.target.value;
            setShortCode(Number(val) || null);
          }}
        />
      </div>
      <button
        onClick={handleComboboxToggle}
        disabled={createProductMutation.isLoading || disabled}
        className={`flex items-center justify-between border-none w-full  px-3 text-sm text-left border-2 border-newDsBorder  text-newDsForeground rounded-md shadow-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-colors duration-200  ${disabled ? 'cursor-not-allowed' : ''} `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="block truncate text-black">
          {isSearching ? "Buscando..." : productValue || "Seleccionar producto"}

        </span>
        <ChevronDown className="w-5 h-5 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute z-30 w-full mt-1 bg-card border-none rounded-md shadow-lg transition-all duration-200 ease-in-out opacity-100 scale-100 origin-top">
          <div className="p-2">
            <input
              ref={inputRef}
              disabled={createProductMutation.isLoading}
              type="text"
              className="w-full px-3 py-2 text-sm bg-muted text-muted-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
              placeholder="Buscar por codigo o por nombre..."
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();

                  if (isCreating) return;

                  // Si hay resultados, seleccionamos el primero
                  if (options.length > 0) {
                    handleSelectProduct(options[0]);
                  } else if (!isSearchValueNumeric && inputValue.trim()) {
                    handleOpenCreating();
                  } else {
                    toast("No se encontró ningún producto con ese nombre o código.");
                  }
                }
              }}
            />
          </div>
          <ul className="max-h-60 overflow-auto py-1 text-base" role="listbox">
            {isSearching ? (
              <li className="relative px-3 py-2 text-muted-foreground cursor-default select-none flex items-center hover:bg-muted focus:bg-muted">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Buscando...
              </li>
            ) : error ? (
              <li className="relative px-3 py-2 text-destructive cursor-default select-none hover:bg-muted focus:bg-muted">
                {error}
              </li>
            ) : options.length === 0 ? (
              <>
                <li className="relative px-3 py-2 text-muted-foreground cursor-default select-none hover:bg-muted focus:bg-muted">
                  No se encontraron resultados
                </li>
                {/* <li
                  className={` ${(inputValue && !isSearchValueNumeric && !isSearching) ? "flex" : "hidden"
                    } relative px-3 py-2 text-muted-foreground select-none hover:bg-muted focus:bg-muted`}
                >
                  <button
                    onClick={() => {
                      handleCreateProduct(inputValue);
                    }}
                    disabled={!inputValue || createProductMutation.isLoading}
                    className={` flex
                     cursor-pointer  gap-2 items-center `}
                  >
                    {createProductMutation.isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span>Agregando {inputValue}</span>
                      </>
                    ) : (
                      `Agregar "${inputValue}" como nombre de un nuevo producto`
                    )}
                  </button>
                </li> */}
              </>
            ) : (
              options.map((option) => (
                <>
                  <li
                    key={option.product_id}
                    className="relative px-3 py-2 cursor-pointer select-none transition-colors duration-200 hover:bg-muted focus:bg-muted text-popover-foreground"
                    role="option"
                    aria-selected={value === option}
                    onClick={() => handleSelectProduct(option)}
                  >
                    <span className="block truncate">{`${option.short_code ?? ''} ${option.short_code ? '-' : ''} ${option.product_name}`}</span>
                    {value === option && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-newDsForeground">
                        <Check className="w-5 h-5" />
                      </span>
                    )}
                  </li>

                </>
              ))



            )}

            {(!isSearchExactMatch && !isSearchValueNumeric && inputValue) && (
              <li className="relative px-3 py-2 select-none border-t border-border mt-1">
                {!isCreating ? (
                  <button
                    onClick={handleOpenCreating}
                    disabled={isSearching || createProductMutation.isLoading}
                    className="flex cursor-pointer gap-2 items-center text-muted-foreground hover:text-foreground text-sm"
                  >
                    Agregar &quot;{inputValue}&quot; como nuevo producto
                  </button>
                ) : (
                  <div className="flex flex-col gap-2 pt-1">
                    <ShortCodeSelector
                      value={isLoadingSuggestion ? null : newShortCode}
                      onChange={(val) => setNewShortCode(val ?? null)}
                      onStatusChange={setShortCodeStatus}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCreateProduct(inputValue, newShortCode ?? undefined)}
                        disabled={createProductMutation.isLoading || !newShortCode || shortCodeStatus !== "available"}
                        className="flex-1 text-xs px-2 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        {createProductMutation.isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        Crear con código corto
                      </button>
                      <button
                        onClick={() => handleCreateProduct(inputValue)}
                        disabled={createProductMutation.isLoading || !!newShortCode}
                        className="flex-1 text-xs px-2 py-1.5 rounded-md border border-input hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        {createProductMutation.isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        Crear sin código corto
                      </button>
                      <button
                        onClick={handleCancelCreating}
                        disabled={createProductMutation.isLoading}
                        className="text-xs px-2 py-1.5 rounded-md text-muted-foreground hover:text-foreground"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )}

          </ul>
        </div>
      )
      }
    </div >
  );
};

export default ProductSelector;

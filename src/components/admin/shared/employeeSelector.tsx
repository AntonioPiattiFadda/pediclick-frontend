/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAppSelector } from "@/hooks/useUserData";
import { createEmployeeByName, getEmployeeByName } from "@/service/profiles";
import type { UserProfile } from "@/types/users";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { toast } from "sonner";

const EmployeeSelector = ({
  value,
  onChange,
}: {
  value: UserProfile;
  onChange: (value: UserProfile) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value.full_name || "");
  const [options, setOptions] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const comboboxRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { role } = useAppSelector((state) => state.user);

  const fetchUsers = useCallback(
    async (searchValue: string) => {
      if (!searchValue) {
        setOptions([]);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const data = await getEmployeeByName(searchValue, role);

        setOptions(data.dbUser || []);
      } catch (err) {
        console.error("Error fetching users:", err);
        // setError(err.message || "Failed to fetch products.");
        setOptions([]);
      } finally {
        setIsSearching(false);
      }
    },
    [role]
  );

  const debouncedFetchMicroOrganisms = useMemo(
    () => debounce(fetchUsers, 300),
    [fetchUsers]
  );

  useEffect(() => {
    if (inputValue) {
      debouncedFetchMicroOrganisms(inputValue);
    } else {
      setOptions([]);
    }
  }, [inputValue, debouncedFetchMicroOrganisms]);

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

  const handleSelectEmployee = (newUser: UserProfile) => {
    onChange(newUser);
    setIsOpen(false);
    setInputValue("");
  };

  const createProductMutation = useMutation({
    mutationFn: async (data: string) => {
      return await createEmployeeByName(data, role);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      console.log(data);
      handleSelectEmployee(data);
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
      toast("Error al crear el usuario", {
        description: "Intentá nuevamente más tarde.",
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      });
    },
  });

  const handleCreateUser = (userName: string) => {
    createProductMutation.mutate(userName);
  };

  return (
    <div className="relative w-full  inline-flex">
      <button
        onClick={handleComboboxToggle}
        disabled={createProductMutation.isLoading}
        className={`flex items-center justify-between border-none w-full h-10 px-3 py-2 text-sm text-left border-2 border-newDsBorder  text-newDsForeground rounded-md shadow-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-colors duration-200   `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="block truncate text-black">
          {value.full_name || "Nombre"}
        </span>
        <ChevronDown className="w-5 h-5 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-card border-none rounded-md shadow-lg transition-all duration-200 ease-in-out opacity-100 scale-100 origin-top">
          <div className="p-2">
            <input
              ref={inputRef}
              disabled={createProductMutation.isLoading}
              type="text"
              className="w-full px-3 py-2 text-sm bg-muted text-muted-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
              placeholder="Buscar por nombre..."
              value={inputValue}
              onChange={handleInputChange}
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
                <li
                  className={` ${
                    inputValue ? "flex" : "hidden"
                  } relative px-3 py-2 text-muted-foreground select-none hover:bg-muted focus:bg-muted`}
                >
                  <button
                    onClick={() => {
                      handleCreateUser(inputValue);
                    }}
                    disabled={!inputValue || createProductMutation.isLoading}
                    className={` flex
                     cursor-pointer  gap-2 items-center `}
                  >
                    {createProductMutation.isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span>Agregando ${inputValue}</span>
                      </>
                    ) : (
                      `Agregar "${inputValue}" como nombre de un nuevo producto`
                    )}
                  </button>
                </li>
              </>
            ) : (
              options.map((option) => (
                <li
                  key={option.id}
                  className="relative px-3 py-2 cursor-pointer select-none transition-colors duration-200 hover:bg-muted focus:bg-muted text-popover-foreground"
                  role="option"
                  aria-selected={value === option}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                    setInputValue("");
                  }}
                >
                  <span className="block truncate">{option.full_name}</span>
                  {value === option && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-newDsForeground">
                      <Check className="w-5 h-5" />
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default EmployeeSelector;

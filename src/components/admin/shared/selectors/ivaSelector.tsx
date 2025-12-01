/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, X } from "lucide-react";
import {
    createContext,
    useContext,
    useState,
    type ReactNode
} from "react";
import toast from "react-hot-toast";

import { Label } from "@/components/ui/label";
import { createIva, getIva } from "@/service/iva";
import type { Iva } from "@/types/iva";

// ---------- Context ----------
interface IvaSelectorContextType {
    value: Iva | null;
    onChange: (iva: Iva | null) => void;
    disabled: boolean;
    iva: Iva[];
    isLoading: boolean;
    // shortCode: number | null;
}

const IvaSelectorContext =
    createContext<IvaSelectorContextType | null>(null);

function useIvaSelectorContext() {
    const ctx = useContext(IvaSelectorContext);
    if (!ctx)
        throw new Error(
            "IvaSelector components must be used inside Root"
        );
    return ctx;
}

// ---------- Root ----------
interface RootProps {
    value: Iva | null;
    onChange: (iva: Iva | null) => void;
    disabled?: boolean;
    children: ReactNode;
    storeId?: number | null;
    // shortCode?: number | null;
    // onChangeShortCode?: (code: number | null) => void;
}

const IvaSelectorRoot = ({
    value,
    onChange,
    disabled = false,
    children,
    // storeId = null
}: RootProps) => {

    const { data: iva, isLoading, isError } = useQuery({
        queryKey: ["iva"],
        queryFn: async () => {
            const response = await getIva();
            return response.ivas;
        },
        enabled: true,
    });
    // const [shortCode, setShortCode] = useState<number | null>(null);

    if (isError) {
        return <div>Error loading iva.</div>;
    }

    return (
        <IvaSelectorContext.Provider
            value={{
                value,
                onChange,
                disabled,
                iva: iva ?? [],
                isLoading,
                // shortCode,
            }}
        >
            <div className="flex items-center gap-2 w-full h-10">{children}</div>
        </IvaSelectorContext.Provider>
    );
};

// ---------- Select ----------
const SelectIva = ({ children }: { children?: ReactNode }) => {
    const { value, onChange, disabled, iva, isLoading, } =
        useIvaSelectorContext();


    // const handleCodeMatch = (code: number) => {
    //     if (!code) return;
    //     const matched = iva.find((m) => m.short_code === code);
    //     if (matched) {
    //         onChange(matched);
    //         debouncedToast.cancel();
    //     } else {
    //         onChange(null);
    //         debouncedToast(`No se encontró un miembro con el código: ${code}`);
    //     }
    // };

    // const debouncedToast = useMemo(
    //     () =>
    //         debounce((msg: string) => {
    //             toast(msg, { icon: "⚠️" });
    //         }, 500),
    //     []
    // );

    // if (isLoading) {
    //     return (
    //         <Input
    //             className="h-10"
    //             placeholder="Buscando miembros..."
    //             disabled
    //         />
    //     );
    // }

    return (
        <>
            <div className="flex w-full border border-gray-200 rounded-md ">
                {/* <Input
                    className={`  border-none    h-9 w-14 `}
                    value={shortCode ?? ""}
                    placeholder="Código"
                    onChange={(e) => {
                        const val = e.target.value;
                        onChangeShortCode(Number(val));
                        handleCodeMatch(Number(val));
                    }}
                /> */}

                {/* <Select
                    disabled={disabled}
                    value={value?.iva_id ?? ""}
                    onValueChange={(val) => {
                        const m = iva.find((m) => m.iva_id === val) || null;
                        onChange(m);
                        // onChangeShortCode(m?.short_code ?? null);
                    }}
                > */}
                <Select
                    disabled={disabled}
                    value={value?.iva_id?.toString() ?? ""}
                    onValueChange={(val) => {
                        const m = iva.find((m) => m.iva_id === Number(val)) || null;
                        onChange(m);
                    }}
                >
                    <SelectTrigger className="h-11 w-full border-none">
                        <SelectValue placeholder="Sin Iva" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Iva</SelectLabel>
                            {iva.map((m) => (
                                <SelectItem key={m.iva_id} value={m.iva_id.toString()}>
                                    {`${m.iva_number}`}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            {children}
        </>
    );
};

// -------- Cancel ----------
const CancelIvaSelection = () => {
    const { value, onChange } = useIvaSelectorContext();

    return (
        value && (
            <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                    onChange(null);
                }}
                className="text-red-500 hover:text-red-700 h-9"
            >
                <X className="w-5 h-5" />
            </Button>
        )
    );
};

// ---------- Create ----------
const CreateIva = ({
    isShortCut = false,
}: {
    isShortCut?: boolean;
}) => {
    const { onChange, disabled } = useIvaSelectorContext();
    const queryClient = useQueryClient();

    const [newIvaData, setNewIvaData] = useState<Iva>({} as Iva);

    // const [showPassword, setShowPassword] = useState(false);



    const [open, setOpen] = useState(false);

    const mutation = useMutation({
        mutationFn: async () => {
            return await createIva(newIvaData);
        },
        onSuccess: (created: { data: Iva }) => {
            queryClient.invalidateQueries({ queryKey: ["iva"] });
            onChange(created.data);
            setOpen(false);

            if (isShortCut) toast("Iva creado", { icon: "✅" });
        },
        onError: (error: any) => {
            toast(error.message, { icon: "⚠️" });
        },
    });

    const handleCreate = async () => {
        if (!newIvaData.iva_number ) return;
        await mutation.mutateAsync();
    };

    // const formattedLocationId = newIvaData.store_id ? `store-${newTeamMemberData.store_id}` : newTeamMemberData.stock_room_id ? `stock-${newTeamMemberData.stock_room_id}` : null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isShortCut ? (
                    <SidebarMenuButton>Iva</SidebarMenuButton>
                ) : (
                    <Button
                        size="icon"
                        className="border border-gray-200"
                        disabled={disabled}
                        variant="outline"
                    >
                        <PlusCircle className="w-5 h-5" />
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear nuevo iva</DialogTitle>
                    <DialogDescription>
                        Completá los datos para crear el iva.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-2">
                    <Label>Numero de Iva</Label>
                    <Input
                        value={newIvaData.iva_number}
                        disabled={mutation.isLoading}
                        onChange={(e) => setNewIvaData({ ...newIvaData, iva_number: Number(e.target.value) })}
                        placeholder="Numero de Iva"
                    />
                </div>

                {/* <div className="flex flex-col gap-2">
                    <Label>Email*</Label>
                    <Input
                        value={newTeamMemberData.email}
                        disabled={mutation.isLoading}
                        onChange={(e) => setNewTeamMemberData({ ...newTeamMemberData, email: e.target.value })}
                        placeholder="Email"
                    />
                </div> */}

                {/* <div className="flex flex-col gap-2">
                    <Label>Contraseña*</Label>
                    <InputGroup>
                        <InputGroupInput
                            type={showPassword ? "text" : "password"}
                            value={newTeamMemberData.password}
                            disabled={mutation.isLoading}
                            onChange={(e) => setNewTeamMemberData({ ...newTeamMemberData, password: e.target.value })}
                            placeholder="Contraseña"
                        />
                        <InputGroupAddon align="inline-end">
                            <button className="cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <Eye className="size-5" /> : <EyeClosed className="size-5" />}
                            </button>

                        </InputGroupAddon>
                    </InputGroup>
                </div> */}

                {/* <div className="flex flex-col gap-2">
                    <Label>Código corto</Label>
                    <Input
                        value={newTeamMemberData.short_code ?? undefined}
                        disabled={mutation.isLoading}
                        onChange={(e) => setNewTeamMemberData({ ...newTeamMemberData, short_code: Number(e.target.value) })}
                        placeholder="Código corto"
                    />
                </div> */}

                {/* <div className="flex flex-col gap-2">
                    <Label>Asignación</Label>
                    <LocationsSelector
                        selectedLocationId={formattedLocationId}
                        onChangeSelectedLocation={(newLocationId, locationType) => {
                            if (locationType === "STORE") {
                                setNewTeamMemberData({ ...newTeamMemberData, store_id: newLocationId ?? 0, stock_room_id: null });
                            } else if (locationType === "STOCK_ROOM") {
                                setNewTeamMemberData({ ...newTeamMemberData, stock_room_id: newLocationId ?? 0, store_id: null });
                            }
                        }}
                        flexDirection="column"
                        label=''
                        placeholder=''
                    />
                </div> */}

                <DialogFooter>
                    <Button
                        disabled={mutation.isLoading}
                        variant="outline"
                        onClick={() => setOpen(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        disabled={
                            mutation.isLoading ||
                            !newIvaData.iva_number 
                        }
                        onClick={handleCreate}
                    >
                        {mutation.isLoading ? "Creando..." : "Crear"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ---------- Exports ----------
export {
    CancelIvaSelection,
    CreateIva, IvaSelectorRoot,
    SelectIva
};



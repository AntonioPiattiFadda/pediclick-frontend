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
import { Eye, EyeClosed, PlusCircle, X } from "lucide-react";
import {
    createContext,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import toast from "react-hot-toast";
import { debounce } from "lodash";
import type { UserProfile } from "@/types/users";
import { createTeamMember, getUserTeamMembers } from "@/service/profiles";
import { Label } from "@/components/ui/label";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

// ---------- Context ----------
interface TeamMemberSelectorContextType {
    value: Pick<UserProfile, 'id' | 'short_code' | 'full_name'> | null;
    onChange: (member: Pick<UserProfile, 'id' | 'short_code' | 'full_name'> | null) => void;
    disabled: boolean;
    teamMembers: UserProfile[];
    isLoading: boolean;
    shortCode: number | null;
    onChangeShortCode: (code: number | null) => void;
}

const TeamMemberSelectorContext =
    createContext<TeamMemberSelectorContextType | null>(null);

function useTeamMemberSelectorContext() {
    const ctx = useContext(TeamMemberSelectorContext);
    if (!ctx)
        throw new Error(
            "TeamMemberSelector components must be used inside Root"
        );
    return ctx;
}

// ---------- Root ----------
interface RootProps {
    value: Pick<UserProfile, 'id' | 'short_code' | 'full_name'> | null;
    onChange: (member: Pick<UserProfile, 'id' | 'short_code' | 'full_name'> | null) => void;
    disabled?: boolean;
    children: ReactNode;
    storeId?: number | null;
    shortCode?: number | null;
    onChangeShortCode?: (code: number | null) => void;
}

const TeamMemberSelectorRoot = ({
    value,
    onChange,
    disabled = false,
    children,
    storeId = null
}: RootProps) => {

    const { data: teamMembers, isLoading, isError } = useQuery({
        queryKey: ["team_members", storeId],
        queryFn: async () => {
            const response = await getUserTeamMembers();
            return response.teamMembers;
        },
        enabled: true,
    });

    const [shortCode, setShortCode] = useState<number | null>(value?.short_code ?? null);

    if (isError) {
        return <div>Error loading team members.</div>;
    }

    return (
        <TeamMemberSelectorContext.Provider
            value={{
                value,
                onChange,
                disabled,
                teamMembers: teamMembers ?? [],
                isLoading,
                shortCode,
                onChangeShortCode: setShortCode,
            }}
        >
            <div className="flex items-center gap-2 w-full h-10">{children}</div>
        </TeamMemberSelectorContext.Provider>
    );
};

// ---------- Select ----------
const SelectTeamMember = ({ children }: { children?: ReactNode }) => {
    const { value, onChange, disabled, teamMembers, isLoading, shortCode, onChangeShortCode } =
        useTeamMemberSelectorContext();


    const handleCodeMatch = (code: number) => {
        if (!code) return;
        const matched = teamMembers.find((m) => m.short_code === code);
        if (matched) {
            onChange(matched);
            debouncedToast.cancel();
        } else {
            onChange(null);
            debouncedToast(`No se encontró un miembro con el código: ${code}`);
        }
    };

    const debouncedToast = useMemo(
        () =>
            debounce((msg: string) => {
                toast(msg, { icon: "⚠️" });
            }, 500),
        []
    );

    if (isLoading) {
        return (
            <Input
                className="h-10"
                placeholder="Buscando miembros..."
                disabled
            />
        );
    }

    return (
        <>
            <div className="flex w-full border border-gray-200 rounded-md ">
                <Input
                    className={`  border-none    h-9 w-14 `}
                    value={shortCode ?? ""}
                    placeholder="Código"
                    disabled={disabled}
                    onChange={(e) => {
                        const val = e.target.value;
                        onChangeShortCode(Number(val));
                        handleCodeMatch(Number(val));
                    }}
                />

                <Select
                    disabled={disabled}
                    value={value?.id ?? ""}
                    onValueChange={(val) => {
                        const m = teamMembers.find((m) => m.id === val) || null;
                        onChange(m);
                        onChangeShortCode(m?.short_code ?? null);
                    }}
                >
                    <SelectTrigger className="h-11 w-full border-none">
                        <SelectValue placeholder="Seleccionar miembro" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Miembros del equipo</SelectLabel>
                            {teamMembers.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                    {`${m.short_code} - ${m.full_name}`}
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
const CancelTeamMemberSelection = () => {
    const { value, onChange, onChangeShortCode } = useTeamMemberSelectorContext();

    return (
        value && (
            <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                    onChange(null);
                    onChangeShortCode(null);
                }}
                className="text-red-500 hover:text-red-700 h-9"
            >
                <X className="w-5 h-5" />
            </Button>
        )
    );
};

// ---------- Create ----------
const CreateTeamMember = ({
    isShortCut = false,
}: {
    isShortCut?: boolean;
}) => {
    const { onChange, disabled } = useTeamMemberSelectorContext();
    const queryClient = useQueryClient();

    const [newTeamMemberData, setNewTeamMemberData] = useState<UserProfile>({} as UserProfile);

    const [showPassword, setShowPassword] = useState(false);

    const [open, setOpen] = useState(false);

    const mutation = useMutation({
        mutationFn: async () => {
            return await createTeamMember(newTeamMemberData);
        },
        onSuccess: (created: { data: UserProfile }) => {
            queryClient.invalidateQueries({ queryKey: ["team_members"] });
            onChange(created.data);
            setOpen(false);

            if (isShortCut) toast("Miembro creado", { icon: "✅" });
        },
        onError: (error: any) => {
            toast(error.message, { icon: "⚠️" });
        },
    });

    const handleCreate = async () => {
        if (!newTeamMemberData.full_name || !newTeamMemberData.email || !newTeamMemberData.password) return;
        await mutation.mutateAsync();
    };


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isShortCut ? (
                    <SidebarMenuButton>Miembro</SidebarMenuButton>
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
                    <DialogTitle>Crear nuevo miembro</DialogTitle>
                    <DialogDescription>
                        Completá los datos para crear el miembro del equipo.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-2">
                    <Label>Nombre completo*</Label>
                    <Input
                        value={newTeamMemberData.full_name}
                        disabled={mutation.isLoading}
                        onChange={(e) => setNewTeamMemberData({ ...newTeamMemberData, full_name: e.target.value })}
                        placeholder="Nombre completo"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <Label>Email*</Label>
                    <Input
                        value={newTeamMemberData.email}
                        disabled={mutation.isLoading}
                        onChange={(e) => setNewTeamMemberData({ ...newTeamMemberData, email: e.target.value })}
                        placeholder="Email"
                    />
                </div>

                <div className="flex flex-col gap-2">
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
                </div>

                <div className="flex flex-col gap-2">
                    <Label>Código corto</Label>
                    <Input
                        value={newTeamMemberData.short_code ?? undefined}
                        disabled={mutation.isLoading}
                        onChange={(e) => setNewTeamMemberData({ ...newTeamMemberData, short_code: Number(e.target.value) })}
                        placeholder="Código corto"
                    />
                </div>

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
                </div>*/}

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
                            !newTeamMemberData.full_name ||
                            !newTeamMemberData.email ||
                            !newTeamMemberData.password
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
    TeamMemberSelectorRoot,
    SelectTeamMember,
    CancelTeamMemberSelection,
    CreateTeamMember,
};




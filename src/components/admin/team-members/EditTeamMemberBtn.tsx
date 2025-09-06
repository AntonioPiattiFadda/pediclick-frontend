/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ValidationErrorMessage } from "@/components/ui/validationErrorMessage";
import { UseUserStoresContext } from "@/contexts/UserStoresContext";
import { editTeamMember, getTeamMemberDataById } from "@/service/profiles";
import type { UserProfile } from "@/types";
import { editTeamMemberSchema } from "@/validator/teamMembers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ZodIssue } from "zod";
import PasswordInfoPopover from "./PasswordInfoPopover";
import RolesInfoPopover, { ROLES } from "./RoleInfoPopover";
import { Edit } from "lucide-react";

const emptyUser: UserProfile = {
  id: "",
  email: "",
  password: "",
  role: "",
  full_name: "",
  address: "",
  phone: "",
  store_id: 0,
  created_at: "",
  updated_at: "",
  deleted_at: "",
  avatar_url: null,
  is_verified: false,
  parent_user_id: "",
  job_position: null,
};

export function EditTeamMemberBtn({ id }: { id: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { userStores } = UseUserStoresContext();
  const [zErrors, setZErrors] = useState<ZodIssue[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserProfile>(emptyUser);

  const queryClient = useQueryClient();

  const { data: teamMember } = useQuery<UserProfile | null>({
    queryKey: ["user-data", id], // ✅ ahora depende del id
    queryFn: async () => {
      const result = await getTeamMemberDataById(id);
      return result.data as UserProfile | null;
    },
    enabled: !!id,
  });

  // ✅ sincronizamos formData con el resultado de la query
  useEffect(() => {
    if (teamMember) {
      setFormData(teamMember);
    }
  }, [teamMember]);

  const editTeamMemberMutation = useMutation({
    mutationFn: async (data: { formData: UserProfile }) => {
      return await editTeamMember(data.formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      setIsModalOpen(false);
      resetForm();
      toast("Excelente!", {
        description: "El miembro de equipo ha sido actualizado correctamente.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message;
      setErrorMessage(errorMessage);
      setTimeout(() => {
        setErrorMessage(null);
      }, 3000);
    },
  });

  const resetForm = () => {
    setZErrors([]);
  };

  const handleSubmit = () => {
    const validation = editTeamMemberSchema.safeParse(formData);

    if (!validation.success) {
      setZErrors(validation.error.issues);
      setTimeout(() => {
        setZErrors([]);
      }, 3000);
      return;
    }

    editTeamMemberMutation.mutate({
      formData: { ...formData, id },
    });
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <button>
          <Edit className="mr-2 h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar Miembro del equipo</DialogTitle>
          <DialogDescription>
            Modificá la información del miembro de equipo seleccionado.
          </DialogDescription>
        </DialogHeader>

        {teamMember ? (
          <>
            <div className="grid gap-4 py-4 relative">
              {/* Full Name */}
              <div className="grid gap-2 relative">
                <Label htmlFor="full_name">Nombre Completo *</Label>
                <Input
                  id="full_name"
                  placeholder="Juan Pérez"
                  className={`border ${
                    zErrors?.find((error: any) =>
                      error.path.includes("full_name")
                    )
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-md p-2`}
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                />
                <ValidationErrorMessage
                  zErrors={zErrors}
                  fieldName="full_name"
                />
              </div>

              {/* Email */}
              <div className="grid gap-2 relative">
                <Label htmlFor="email">Email * (No puede cambiarse)</Label>
                <Input
                  id="email"
                  type="email"
                  disabled
                  className="border border-gray-300 rounded-md p-2"
                  value={formData.email}
                />
              </div>

              {/* Password */}
              <div className="grid gap-2 relative">
                <div className="flex gap-4">
                  <Label htmlFor="password">Contraseña *</Label>
                  <div className="w-5 h-5">
                    <PasswordInfoPopover />
                  </div>
                </div>

                <Input
                  id="password"
                  type="password"
                  disabled
                  className="border border-gray-300 rounded-md p-2"
                  placeholder="*******"
                  value={formData.password}
                />
              </div>

              {/* Role */}
              <div className="grid gap-2 relative">
                <div className="flex gap-4">
                  <Label htmlFor="role">Rol *</Label>
                  <div className="w-5 h-5">
                    <RolesInfoPopover />
                  </div>
                </div>
                <Select
                  value={formData.role || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger
                    className={`w-full ${
                      zErrors?.find((error: any) => error.path.includes("role"))
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  >
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.filter((rol) => rol.value !== "OWNER").map(
                      (role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <ValidationErrorMessage zErrors={zErrors} fieldName="role" />
              </div>

              {/* Store */}
              <div className="grid gap-2 relative">
                <Label htmlFor="store">Punto de venta *</Label>
                <Select
                  value={formData.store_id ? String(formData.store_id) : ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, store_id: Number(value) })
                  }
                >
                  <SelectTrigger
                    className={` w-full ${
                      zErrors?.find((error: any) =>
                        error.path.includes("store_id")
                      )
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  >
                    <SelectValue placeholder="Seleccionar punto de venta" />
                  </SelectTrigger>
                  <SelectContent>
                    {userStores.map((store) => (
                      <SelectItem
                        key={store.store_id}
                        value={String(store.store_id)}
                      >
                        {store.store_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ValidationErrorMessage
                  zErrors={zErrors}
                  fieldName="store_id"
                />
              </div>

              {/* Job Position */}
              <div className="grid gap-2 relative">
                <Label htmlFor="job_position">
                  Puesto de trabajo (opcional)
                </Label>
                <Input
                  id="job_position"
                  placeholder="Descripción del puesto"
                  className="border border-gray-300 rounded-md p-2"
                  value={formData.job_position || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, job_position: e.target.value })
                  }
                />
              </div>

              {/* Phone */}
              <div className="grid gap-2 relative">
                <Label htmlFor="phone">Teléfono (opcional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+54 9 11 1234-5678"
                  className="border border-gray-300 rounded-md p-2"
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              {/* Address */}
              <div className="grid gap-2 relative">
                <Label htmlFor="address">Dirección (opcional)</Label>
                <Textarea
                  id="address"
                  placeholder="Calle Ejemplo 123, Ciudad, Provincia"
                  className="border border-gray-300 rounded-md"
                  value={formData.address || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={3}
                />
              </div>

              {errorMessage && (
                <div className="mt-2 text-sm text-red-500 absolute -bottom-4">
                  {errorMessage}
                </div>
              )}
            </div>

            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button
                  disabled={editTeamMemberMutation.isLoading}
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                disabled={editTeamMemberMutation.isLoading}
                onClick={handleSubmit}
              >
                {editTeamMemberMutation.isLoading
                  ? "Actualizando..."
                  : "Actualizar Miembro"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <Skeleton className="h-96" />
        )}
      </DialogContent>
    </Dialog>
  );
}

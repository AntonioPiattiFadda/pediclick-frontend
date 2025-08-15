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
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useState } from "react";
import { createTeamMember } from "@/service";
import { createTeamMemberSchema } from "@/validator/teamMembers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUserStoresContext } from "@/contexts/UserStoresContext";
import type { TeamMember } from "@/types";
import RolesInfoPopover from "./RoleInfoPopover";

const emptyUser: TeamMember = {
  id: "",
  email: "",
  password: "",
  role: "",
  full_name: "",
  // avatar_url: "",
  address: "",
  phone: "",
  store_id: 0,
  created_at: "",
  updated_at: "",
  deleted_at: "",
};

export function AddTeamMemberBtn() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { userStores } = useUserStoresContext();
  // const [avatarPreview, setAvatarPreview] = useState<string>("");
  // const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<TeamMember>(emptyUser);

  const queryClient = useQueryClient();

  const createTeamMemberMutation = useMutation({
    mutationFn: async (data: { formData: any }) => {
      return await createTeamMember(data.formData);
    },
    onSuccess: () => {
      alert("todo bien");
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      setIsModalOpen(false);
      resetForm();
      toast("Miembro de equipo agregado exitosamente", {
        description: "El miembro de equipo ha sido creado correctamente.",
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message;
      toast("Error al crear Miembro de equipo", {
        description: errorMessage,
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      });
    },
  });

  const resetForm = () => {
    setFormData(emptyUser);
    // setAvatarPreview("");
  };

  // const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onload = () => {
  //       const result = reader.result as string;
  //       setAvatarPreview(result);
  //       setFormData({ ...formData, avatar_url: result });
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  // const removeAvatar = () => {
  //   setAvatarPreview("");
  //   setFormData({ ...formData, avatar_url: "" });
  //   if (fileInputRef.current) {
  //     fileInputRef.current.value = "";
  //   }
  // };

  const handleSubmit = () => {
    const validation = createTeamMemberSchema.safeParse(formData);

    if (!validation.success) {
      const errors = validation.error.errors;
      const errorMessages = errors
        .map((error) => `${error.path.join(".")}: ${error.message}`)
        .join(", ");

      toast("Datos incompletos o incorrectos", {
        description: errorMessages,
        action: {
          label: "Cerrar",
          onClick: () => console.log("Close"),
        },
      });
      return;
    }

    createTeamMemberMutation.mutate({
      formData,
    });
  };

  const roles = [
    { value: "MANAGER", label: "Encargado" },
    { value: "EMPLOYEE", label: "Empleado" },
  ];

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-accent" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Agregar Miembro del equipo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nuevo Miembro del equipo</DialogTitle>
          <DialogDescription>
            Completá la información del nuevo miembro del equipo que querés
            agregar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Avatar Upload */}
          {/* <div className="grid gap-2">
            <Label htmlFor="avatar">Avatar (opcional)</Label>
            <div className="flex items-center gap-4">
              {avatarPreview ? (
                <div className="relative">
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                    onClick={removeAvatar}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarPreview ? "Cambiar Avatar" : "Subir Avatar"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
            </div>
          </div> */}

          {/* Full Name */}
          <div className="grid gap-2">
            <Label htmlFor="full_name">Nombre Completo *</Label>
            <Input
              id="full_name"
              placeholder="Juan Pérez"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
            />
          </div>

          {/* Email */}
          <div className="grid gap-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="juan@ejemplo.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          {/* Password */}
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña *</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>

          {/* Role */}
          <div className="grid gap-2">
            <Label htmlFor="role">Rol *</Label>
            <div className=" w-5 h-5">
              <RolesInfoPopover />
            </div>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData({ ...formData, role: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tienda */}
          <div className="grid gap-2">
            <Label htmlFor="store">Punto de venta *</Label>
            <Select
              value={formData.store_id}
              onValueChange={(value) =>
                setFormData({ ...formData, store_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tienda" />
              </SelectTrigger>
              <SelectContent>
                {userStores.map((store) => (
                  <SelectItem key={store.store_id} value={store.store_id}>
                    {store.store_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="job_position">Puesto de trabajo (opcional)</Label>
            <Input
              id="job_position"
              placeholder="Descripción del puesto"
              value={formData.job_position}
              onChange={(e) =>
                setFormData({ ...formData, job_position: e.target.value })
              }
            />
          </div>

          {/* Phone */}
          <div className="grid gap-2">
            <Label htmlFor="phone">Teléfono (opcional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+54 9 11 1234-5678"
              value={formData.phone || ""}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          {/* Address */}
          <div className="grid gap-2">
            <Label htmlFor="address">Dirección (opcional)</Label>
            <Textarea
              id="address"
              placeholder="Calle Ejemplo 123, Ciudad, Provincia"
              value={formData.address || ""}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button
              disabled={createTeamMemberMutation.isLoading}
              variant="outline"
              onClick={resetForm}
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            disabled={createTeamMemberMutation.isLoading}
            onClick={handleSubmit}
          >
            {createTeamMemberMutation.isLoading
              ? "Creando..."
              : "Crear Miembro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

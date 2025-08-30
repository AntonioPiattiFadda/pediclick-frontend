// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogClose,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { useUserStoresContext } from "@/contexts/UserStoresContext";
// import { createTeamMemberSchema } from "@/validator/teamMembers";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { Plus } from "lucide-react";
// import { useState } from "react";
// import { toast } from "sonner";
// import type { ZodIssue } from "zod";
// // import RolesInfoPopover, { ROLES } from "./RoleInfoPopover";
// import { createTeamMember } from "@/service/profiles";
// import type { UserProfile } from "@/types";
// // import PasswordInfoPopover from "./PasswordInfoPopover";

// const emptyUser: UserProfile = {
//   id: "",
// };

// export function AddLoadOrderBtn() {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const { userStores } = useUserStoresContext();
//   const [zErrors, setZErrors] = useState<ZodIssue[]>([]);
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);
//   const [formData, setFormData] = useState<UserProfile>(emptyUser);

//   const queryClient = useQueryClient();

//   const createTeamMemberMutation = useMutation({
//     mutationFn: async (data: { formData: any }) => {
//       return await createTeamMember(data.formData);
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["team-members"] });
//       setIsModalOpen(false);
//       resetForm();
//       toast("Miembro de equipo agregado exitosamente", {
//         description: "El miembro de equipo ha sido creado correctamente.",
//         action: {
//           label: "Undo",
//           onClick: () => console.log("Undo"),
//         },
//       });
//     },
//     onError: (error: any) => {
//       const errorMessage = error.message;
//       setErrorMessage(errorMessage);
//       setTimeout(() => {
//         setErrorMessage(null);
//       }, 3000);
//     },
//   });

//   const resetForm = () => {
//     setFormData(emptyUser);
//     setZErrors([]);
//   };

//   const handleSubmit = () => {
//     const validation = createTeamMemberSchema.safeParse(formData);

//     if (!validation.success) {
//       setZErrors(validation.error.issues);
//       setTimeout(() => {
//         setZErrors([]);
//       }, 3000);
//       return;
//     }

//     createTeamMemberMutation.mutate({
//       formData,
//     });
//   };

//   return (
//     <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
//       <DialogTrigger asChild>
//         <Button className="bg-primary text-accent" variant="outline">
//           <Plus className="mr-2 h-4 w-4" />
//           Agregar
//         </Button>
//       </DialogTrigger>
//       <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
//         <DialogHeader>
//           <DialogTitle>Nuevo Miembro del equipo</DialogTitle>
//           <DialogDescription>
//             Completá la información del nuevo miembro del equipo que querés
//             agregar.
//           </DialogDescription>
//         </DialogHeader>

//         <div className="grid gap-4 py-4 relative"></div>

//         <DialogFooter className="mt-4">
//           <DialogClose asChild>
//             <Button
//               disabled={createTeamMemberMutation.isLoading}
//               variant="outline"
//               onClick={resetForm}
//             >
//               Cancelar
//             </Button>
//           </DialogClose>
//           <Button
//             disabled={createTeamMemberMutation.isLoading}
//             onClick={handleSubmit}
//           >
//             {createTeamMemberMutation.isLoading
//               ? "Creando..."
//               : "Crear Miembro"}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }

// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import type { SaleUnit }  "@/types";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { Trash2 } from "lucide-react";
// import { useState } from "react";
// import { toast } from "sonner";

// interface SaleUnitSelectProps {
//   value: string;
//   onChange: (id: string) => void;
//   isLoadingSaleUnits: boolean;
//   saleUnits: SaleUnit[];
// }

// export function SaleUnitSelector({
//   isLoadingSaleUnits,
//   saleUnits,
//   value,
//   onChange,
// }: SaleUnitSelectProps) {
//   const queryClient = useQueryClient();

//   const [newSaleUnit, setNewSaleUnit] = useState("");
//   const [open, setOpen] = useState(false);



//   const createSaleUnitMutation = useMutation({
//     mutationFn: async (data: { newSaleUnit: string }) => {
//       return await createSaleUnit(data.newSaleUnit);
//     },
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: ["sale_units"] });
//       onChange(data.sale_unit_id);
//       setOpen(false);
//     },
//     onError: (error: any) => {
//       const errorMessage = error.message;
//       toast("Error al crear unidad de venta", {
//         description: errorMessage,
//       });
//     },
//   });

//   const handleCreateSaleUnit = async () => {
//     if (!newSaleUnit) return;

//     try {
//       await createSaleUnitMutation.mutateAsync({ newSaleUnit });
//       setNewSaleUnit("");
//     } catch (error) {
//       console.error("Error creating sale unit:", error);
//     }
//   };

//   if (isLoadingSaleUnits) {
//     return <Input placeholder="Buscando unidades de venta..." disabled />;
//   }

//   return (
//     <div className="flex items-center gap-2 w-full">
//       <select
//         className="w-full border rounded px-2 py-2"
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//       >
//         <option value="">Sin Unidad</option>
//         {(saleUnits ?? []).map((unit: any) => (
//           <option key={unit.sale_unit_id} value={unit.sale_unit_id}>
//             {unit.sale_unit_name}
//           </option>
//         ))}
//       </select>

//       {/* Si hay selección, mostrar tacho */}
//       {value && (
//         <Button
//           variant="ghost"
//           size="icon"
//           onClick={() => onChange("")}
//           className="text-red-500 hover:text-red-700"
//         >
//           <Trash2 className="w-5 h-5" />
//         </Button>
//       )}

//       {/* Botón para crear nueva unidad de venta */}
//       <Dialog open={open} onOpenChange={setOpen}>
//         <DialogTrigger asChild>
//           <Button variant="outline">+ Nuevo</Button>
//         </DialogTrigger>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Crear nueva unidad de venta</DialogTitle>
//             <DialogDescription>
//               Ingresá el nombre de la nueva unidad que quieras crear (ej: Kg, Docena, Unidad).
//             </DialogDescription>
//           </DialogHeader>

//           <Input
//             value={newSaleUnit}
//             disabled={createSaleUnitMutation.isLoading}
//             onChange={(e) => setNewSaleUnit(e.target.value)}
//             placeholder="Nombre de la unidad de venta"
//           />

//           <DialogFooter>
//             <Button
//               disabled={createSaleUnitMutation.isLoading}
//               variant="outline"
//               onClick={() => setOpen(false)}
//             >
//               Cancelar
//             </Button>
//             <Button
//               disabled={createSaleUnitMutation.isLoading}
//               onClick={handleCreateSaleUnit}
//             >
//               {createSaleUnitMutation.isLoading ? "Creando..." : "Crear"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

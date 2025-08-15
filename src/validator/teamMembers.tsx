import { z } from "zod";

export const createTeamMemberSchema = z.object({
  email: z.string().min(1, "El email es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
  role: z.string().min(1, "El rol es requerido"),
  // full_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  // avatar_url: z.string().optional().or(z.literal("")),
  // address: z.string().optional().or(z.literal("")),
  // phone: z.string().optional().or(z.literal("")),

  store_id: z.number().min(1, "La tienda a la que pertenece es requerida"),

  //A que local pertenece
  //A que encargado pertenece si es empleado
  //Esto tiene que venir por parametros
});

import { z } from "zod";

export const createStoreSchema = z.object({
  store_name: z.string().min(1, "Nombre de la Tienda es Obligatorio"),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("Formato de email inválido").optional().or(z.literal("")),
  website: z.string().url("Formato de URL inválido").optional().or(z.literal("")),
  social_links: z.string().optional(),
  opening_hours: z.string().optional(),
  slug: z.string().optional()
});

export const editStoreSchema = z.object({
  store_name: z.string().min(1, "Nombre de la Tienda es Obligatorio"),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("Formato de email inválido").optional().or(z.literal("")),
  website: z.string().url("Formato de URL inválido").optional().or(z.literal("")),
  social_links: z.string().optional(),
  opening_hours: z.string().optional(),
  slug: z.string().optional()
});
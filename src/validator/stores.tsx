import { z } from "zod";

export const createStoreSchema = z.object({
  store_name: z.string().min(1, "Store name is required"),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  website: z.string().url("Invalid URL format").optional().or(z.literal("")),
  social_links: z.string().optional(),
  opening_hours: z.string().optional(),
  slug: z.string().optional()
});
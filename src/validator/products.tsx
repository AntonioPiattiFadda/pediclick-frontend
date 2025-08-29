import { z } from "zod";
export const createProductSchema = z.object({
  product_name: z.string().min(1),
});

export const updateProductSchema = z.object({
  product_name: z.string().min(1),
});

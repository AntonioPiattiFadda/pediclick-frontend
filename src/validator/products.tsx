import { z } from "zod";
export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  category_id: z.string().min(1),
  prices: z
    .array(
      z.object({
        price: z.string().min(1, "El monto es requerido"),
        unit_id: z.string().min(1, "La unidad es requerida"),
      })
    )
    .min(1, "Debe haber al menos un precio"),
  images: z.array(z.instanceof(File)).min(1, "Debe subir al menos una imagen"),
});
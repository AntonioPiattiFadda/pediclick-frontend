/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Lot } from "@/types/lots";
import type { Product } from "@/types/products";
import type { Stock } from "@/types/stocks";

// const convertStringLocalDateToISOString = (date: string): string | null => {
//   if (!date) return null;
//   const localDate = new Date(date);
//   const isoDate = localDate.toISOString();
//   return isoDate;
// };

// function formatDateOnly(isoString: string): string {
//   if (!isoString) return "";
//   return isoString.split("T")[0];
// }

export const adaptProductForDb = (product: any): Product => {
  return {
    product_name: product.product_name,
    product_description: product.product_description,
    allow_stock_control: product.allow_stock_control,
    category_id: Number(product.category_id) || null,
    sub_category_id: Number(product.sub_category_id) || null,
    short_code: Number(product.short_code) || null,
    barcode: Number(product.barcode) || null,
    brand_id: Number(product.brand_id) || null,
    lot_control: product.lot_control || null,
    public_image_id: product.public_image_id || null,
    observations: product.observations || null,
    sell_measurement_mode: product.sell_measurement_mode || null,
    updated_at: product.updated_at || null,
    equivalence_minor_mayor_selling: {
      minor: Number(product.equivalence_minor_mayor_selling?.minor) || null,
      mayor: Number(product.equivalence_minor_mayor_selling?.mayor) || null,
    },
  };
};

export const adaptProductsForClient = (products: any): Product[] => {
  return products.map((product: any) => {
    const formattedLots = (product.lots ?? []).map((lot: Lot) => {
      const lotData = {
        //TODO No mapear todo el lote porque no es necesario en la tabla y hace el objeto muy gigante
        ...lot,
        stockData: {
          purchase_cost_per_unit: lot.purchase_cost_per_unit,
          lot_number: lot.lot_number,
          lot_id: lot.lot_id,
          totalQty: lot?.stock?.reduce((sum, s) => sum + (s?.current_quantity ?? 0), 0),
          stock: (lot.stock as Stock[] | undefined)?.length ? (lot.stock as Stock[])[0] : undefined,
        }
      };
      return lotData;
    });
    return {
      product_id: product.product_id,
      public_image_src: product?.public_images?.public_image_src || null,
      short_code: product.short_code,
      product_name: product.product_name,
      category_id: product.category_id,
      sub_category_id: product.sub_category_id,
      brand_id: product.brand_id,
      barcode: product.barcode,
      public_image_id: product.public_image_id,
      allow_stock_control: product.allow_stock_control,
      lot_control: product.lot_control,
      public_images: product.public_images,
      categories: product.categories,
      sub_categories: product.sub_categories,
      brands: product.brands,
      has_stock: product.lots ? product.lots.length > 0 : false,
      lots: formattedLots,
      created_at: product.created_at,

    }
  });
};

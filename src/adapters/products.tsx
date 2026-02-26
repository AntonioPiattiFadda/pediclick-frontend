/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ProductPresentation } from "@/types/productPresentation";
import type { Product } from "@/types/products";


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
    iva_id: product.iva_id || null,
    updated_at: product.updated_at || null,
    product_presentations: product.product_presentations as ProductPresentation[] | undefined,
  };
};

export const adaptProductsForClient = (products: any): Product[] => {
  return products.map((product: any) => {
    const productLots: any[] = product.lots ?? [];

    // Distribute product-level lots to each presentation.
    // Stock quantities are divided by bulk_quantity_equivalence so each presentation
    // row shows its own unit count (e.g. 400 kg base → cajón row shows 2, kg row shows 400).
    const adaptedPresentations = product.product_presentations?.map((pp: any) => {
      const equiv: number = pp.bulk_quantity_equivalence || 1;
      return {
        ...pp,
        lots: productLots.map((lot: any) => ({
          ...lot,
          product_presentation_id: pp.product_presentation_id,
          stock: (lot.stock ?? []).map((s: any) => ({
            ...s,
            quantity: Math.floor((s.quantity || 0) / equiv),
            reserved_for_selling_quantity:
              s.reserved_for_selling_quantity != null
                ? Math.floor((s.reserved_for_selling_quantity || 0) / equiv)
                : null,
            reserved_for_transferring_quantity:
              s.reserved_for_transferring_quantity != null
                ? Math.floor((s.reserved_for_transferring_quantity || 0) / equiv)
                : null,
          })),
        })),
      };
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
      product_presentations: adaptedPresentations,
      created_at: product.created_at,
      nameAndCode: {
        name: product.product_name,
        short_code: product.short_code,
      }
    };
  });
};

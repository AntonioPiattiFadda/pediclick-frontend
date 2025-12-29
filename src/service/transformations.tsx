import type { TransformationItems } from "@/types/transformationItems";
import { supabase } from ".";
import { getBusinessOwnerId } from "./profiles";
import type { Transformation } from "@/types/transformation";

export async function createTransformation(transformation: Omit<Transformation, 'created_at'>, fromTransformationItems: TransformationItems[], toTransformationItems: TransformationItems[]) {
    const businessOwnerId = await getBusinessOwnerId();

    const location = localStorage.getItem("selectedStore");
    const locationId = location ? Number(JSON.parse(location)) : 0;

    const adaptedFromTransformationItems: Omit<TransformationItems, 'product' | 'product_presentation'>[] = fromTransformationItems.map((it) => ({
        transformation_item_id: it.transformation_item_id,
        transformation_id: it.transformation_id,
        product_id: it.product_id,
        product_presentation_id: it.product_presentation_id,
        lot_id: it.lot_id,
        stock_id: it.stock_id,
        is_origin: it.is_origin,
        quantity: it.quantity,
        max_quantity: it.max_quantity,
        bulk_quantity_equivalence: it.bulk_quantity_equivalence,
        final_cost_per_unit: it.final_cost_per_unit,
        final_cost_per_bulk: it.final_cost_per_bulk,
        final_cost_total: it.final_cost_total,
        location_id: it.location_id,
        lot: null,
    }));

    const adaptedToTransformationItems = toTransformationItems.map((it) => ({
        transformation_item_id: it.transformation_item_id,
        transformation_id: it.transformation_id,
        product_id: it.product_id,
        product_presentation_id: it.product_presentation_id,
        lot_id: it.lot_id,
        stock_id: it.stock_id,
        is_origin: it.is_origin,
        quantity: it.quantity,
        max_quantity: it.max_quantity,
        bulk_quantity_equivalence: it.bulk_quantity_equivalence,
        final_cost_per_unit: it.final_cost_per_unit,
        final_cost_per_bulk: it.final_cost_per_bulk,
        final_cost_total: it.final_cost_total,
        location_id: locationId,
        lot: {
            product_id: it.product_id,
            provider_id: it?.lot?.provider_id,
            product_presentation_id: it.product_presentation_id,
            expiration_date: it?.lot?.expiration_date,
            parent_lot_id: it?.lot?.lot_id,
            final_cost_per_unit: it?.lot?.final_cost_per_unit,
            final_cost_per_bulk: it?.lot?.final_cost_per_bulk,
            final_cost_total: it?.lot?.final_cost_total,
            expiration_date_notification: it?.lot?.expiration_date_notification,
            is_parent_lot: false,
        },
    }));

    const adaptedTranformationData = {
        ...transformation,
        business_owner_id: businessOwnerId,
    };

    console.log("Adapted Transformation Data:", adaptedTranformationData);
    console.log("Adapted Transformation Items:", [...adaptedToTransformationItems]);

    const { data, error } = await supabase.rpc('create_transformation', {
        p_transformation_data: adaptedTranformationData,
        p_transformation_items: [...adaptedFromTransformationItems, ...adaptedToTransformationItems],
    });

    console.log("Data:", data);
    console.log("Error:", error);

    if (error) {
        throw error;
    }

    return data;
}

import type { TransformationItems } from "@/types/transformationItems";
import { supabase } from ".";
import { getOrganizationId } from "./profiles";
import type { Transformation } from "@/types/transformation";

export async function createTransformation(transformation: Omit<Transformation, 'created_at'>, fromTransformationItems: TransformationItems[], toTransformationItems: TransformationItems[], locationId: number) {
    const organizationId = await getOrganizationId();

    const adaptedFromTransformationItems: Omit<TransformationItems, 'product' | 'product_presentation'>[] = fromTransformationItems.map((it) => ({
        transformation_item_id: it.transformation_item_id,
        transformation_id: it.transformation_id,
        product_id: it.product_id,
        product_presentation_id: it.product_presentation_id,
        lot_id: it.lot_id,
        stock_id: it.stock_id,
        is_origin: it.is_origin,
        quantity: it.quantity,
        quantity_in_base_units: it.quantity_in_base_units,
        max_quantity: it.max_quantity,
        bulk_quantity_equivalence: it.bulk_quantity_equivalence,
        final_cost_per_unit: it.final_cost_per_unit || null,
        location_id: locationId,
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
        quantity_in_base_units: (it?.quantity || 0) * (it.bulk_quantity_equivalence || 1),
        max_quantity: it.max_quantity,
        bulk_quantity_equivalence: it.bulk_quantity_equivalence,
        final_cost_per_unit: it?.final_cost_per_unit || null,
        location_id: locationId,
        lot: {
            product_id: it.product_id,
            provider_id: it?.lot?.provider_id,
            product_presentation_id: it.product_presentation_id,
            expiration_date: it?.lot?.expiration_date,
            final_cost_per_unit: it?.lot?.final_cost_per_unit,
            expiration_date_notification: it?.lot?.expiration_date_notification,
            is_parent_lot: false,
        },
    }));

    const { data: { user } } = await supabase.auth.getUser();

    const adaptedTransformationData = {
        ...transformation,
        created_by: user?.id,
    };

    const reqBody = {
        p_transformation_data: adaptedTransformationData,
        p_transformation_items: [...adaptedFromTransformationItems, ...adaptedToTransformationItems],
        p_organization_id: organizationId,
    }

    console.log("Request Body for create_transformation:", reqBody);

    const { data, error } = await supabase.rpc('create_transformation', reqBody);

    console.log("Data:", data);
    console.log("Error:", error);

    if (error) {
        throw error;
    }

    return data;
}

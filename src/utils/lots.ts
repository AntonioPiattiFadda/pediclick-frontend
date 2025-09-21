import type { Lot } from "@/types/lots";

/**
 * Numeric fields that participate in dependent calculations.
 */
type NumericField =
    | "initial_stock_quantity"
    | "purchase_cost_total"
    | "purchase_cost_per_unit"
    | "download_total_cost"
    | "download_cost_per_unit";

/**
 * Update a Lot with a partial patch and keep dependent fields consistent.
 * Rules (mirrors logic used in lot creation/edit forms):
 * - Changing initial_stock_quantity:
 *   - If stock <= 0 => zero-out totals and per-unit fields.
 *   - Else recompute totals from per-unit if available, otherwise per-unit from totals.
 * - Changing purchase_cost_per_unit:
 *   - If per-unit <= 0 => total = 0
 *   - Else if stock > 0 => total = per-unit * stock
 * - Changing purchase_cost_total:
 *   - If total <= 0 => per-unit = 0
 *   - Else if stock > 0 => per-unit = total / stock
 * - Same coupling rules apply for download_total_cost and download_cost_per_unit.
 */
export function updateLotWithCalculations(lot: Lot, patch: Partial<Lot>): Lot {
    const merged: Lot = { ...lot, ...patch };

    const stock = numberOrZero(merged.initial_stock_quantity);
    let purchaseTotal = numberOrZero(merged.purchase_cost_total);
    let purchasePerUnit = numberOrZero(merged.purchase_cost_per_unit);
    let downloadTotal = numberOrZero(merged.download_total_cost);
    let downloadPerUnit = numberOrZero(merged.download_cost_per_unit);

    const changedKeys = new Set(Object.keys(patch) as (keyof Lot)[]);
    const changed = (k: NumericField) => changedKeys.has(k as keyof Lot);

    // 1) Stock changed: resolves both purchase and download pairs
    if (changed("initial_stock_quantity")) {
        if (stock <= 0) {
            purchaseTotal = 0;
            purchasePerUnit = 0;
            downloadTotal = 0;
            downloadPerUnit = 0;
        } else {
            // Purchase
            if (purchasePerUnit > 0) {
                purchaseTotal = round(purchasePerUnit * stock);
            } else if (purchaseTotal > 0) {
                purchasePerUnit = round(safeDiv(purchaseTotal, stock));
            }
            // Download
            if (downloadPerUnit > 0) {
                downloadTotal = round(downloadPerUnit * stock);
            } else if (downloadTotal > 0) {
                downloadPerUnit = round(safeDiv(downloadTotal, stock));
            }
        }
    }

    // 2) Purchase pair coupling (only if stock wasn't already handled above)
    if (changed("purchase_cost_per_unit") && !changed("initial_stock_quantity")) {
        if (purchasePerUnit <= 0) {
            purchaseTotal = 0;
        } else if (stock > 0) {
            purchaseTotal = round(purchasePerUnit * stock);
        }
    }

    if (changed("purchase_cost_total") && !changed("initial_stock_quantity")) {
        if (purchaseTotal <= 0) {
            purchasePerUnit = 0;
        } else if (stock > 0) {
            purchasePerUnit = round(safeDiv(purchaseTotal, stock));
        }
    }

    // 3) Download pair coupling (only if stock wasn't already handled above)
    if (changed("download_cost_per_unit") && !changed("initial_stock_quantity")) {
        if (downloadPerUnit <= 0) {
            downloadTotal = 0;
        } else if (stock > 0) {
            downloadTotal = round(downloadPerUnit * stock);
        }
    }

    if (changed("download_total_cost") && !changed("initial_stock_quantity")) {
        if (downloadTotal <= 0) {
            downloadPerUnit = 0;
        } else if (stock > 0) {
            downloadPerUnit = round(safeDiv(downloadTotal, stock));
        }
    }

    // NOTE: We intentionally do not touch extra_cost_* or final_cost_* here,
    // as those may depend on broader business rules (transport, commissions, etc.)

    const result: Lot = {
        ...merged,
        initial_stock_quantity: stock,
        purchase_cost_total: purchaseTotal,
        purchase_cost_per_unit: purchasePerUnit,
        download_total_cost: downloadTotal,
        download_cost_per_unit: downloadPerUnit,
    };

    return result;
}

/**
 * Convenience function to update a single numeric field with dependent-calculation rules.
 */
export function updateLotField(
    lot: Lot,
    field: NumericField,
    value: number | string
): Lot {
    const numeric = typeof value === "string" ? Number(value) : value;
    const patch: Partial<Lot> = { [field]: numeric } as Partial<Lot>;
    return updateLotWithCalculations(lot, patch);
}

function numberOrZero(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) && !Number.isNaN(n) ? n : 0;
}

function safeDiv(a: number, b: number): number {
    if (!b) return 0;
    return a / b;
}

function round(n: number, decimals = 4): number {
    const p = Math.pow(10, decimals);
    return Math.round(n * p) / p;
}
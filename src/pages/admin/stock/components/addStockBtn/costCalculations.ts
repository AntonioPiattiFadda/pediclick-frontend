export interface CostGroup {
  per_bulk: number;
  per_unit: number;
  total: number;
}

export const ZERO_GROUP: CostGroup = { per_bulk: 0, per_unit: 0, total: 0 };

const round2 = (n: number) => Math.round(n * 100) / 100;

export function calcFromBulk(perBulk: number, stock: number, bulkEquiv: number): CostGroup {
  if (perBulk === 0 || stock === 0) return ZERO_GROUP;
  return {
    per_bulk: round2(perBulk),
    per_unit: round2(perBulk / bulkEquiv),
    total:    round2(perBulk * stock),
  };
}

export function calcFromUnit(perUnit: number, stock: number, bulkEquiv: number): CostGroup {
  if (perUnit === 0 || stock === 0) return ZERO_GROUP;
  const perBulk = round2(perUnit * bulkEquiv);
  return {
    per_bulk: perBulk,
    per_unit: round2(perUnit),
    total:    round2(perBulk * stock),
  };
}

export function calcFromTotal(total: number, stock: number, bulkEquiv: number): CostGroup {
  if (total === 0 || stock === 0) return ZERO_GROUP;
  const perBulk = round2(total / stock);
  return {
    per_bulk: perBulk,
    per_unit: round2(perBulk / bulkEquiv),
    total:    round2(total),
  };
}

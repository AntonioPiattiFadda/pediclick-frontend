import type { Lot } from "@/types/lots";
import type { Price } from "@/types/prices";

export const emptyLot: Lot = {
  lot_number: null,
  expiration_date: null,
  expiration_date_notification: false,
  provider_id: null,
  load_order_id: null,
  product_id: 0,
  has_lot_container: false,
  is_parent_lot: false,
  is_sold_out: false,
  lot_container_id: null,
  initial_stock_quantity: 0,
  total_cost: 0,
  cost_per_unit: 0,
  parent_lot_id: null,
  is_expired: false,
  sale_units_equivalence: {
    minor: {
      quantity_in_base: 0,
    },
    mayor: {
      quantity_in_base: 0,
    },
  },
  //  {
  //   quantity: null,
  //   created_at: null,
  //   should_notify_owner: false,
  //   location: null,
  // },

  // acá decidís si querés que el control sea con stock único o no
  lot_control: false,
};

export const emptyPrices: Price[] = [];

export const mockPrices: Price[] = [
  // =========================
  // MINOR
  // =========================

  // MINOR + SPECIAL
  {
    price_id: 1,
    lot_id: 1001,
    price_number: 3,
    unit_price: 950, // precio especial fijo
    units_per_price: 25,
    price_type: "MINOR",
    profit_percentage: 0,
    logic_type: "SPECIAL",
    observations: "Oferta especial para clientes frecuentes",
    is_limited_offer: false,
    is_active: true,
    valid_from: "2025-09-01T00:00:00Z",
    valid_until: null,
    created_at: "2025-09-01T10:00:00Z",
    updated_at: null,
  },

  // MINOR + QUANTITY_DISCOUNT (ejemplo 1)
  {
    price_id: 2,
    lot_id: 1001,
    price_number: 1,
    unit_price: 1000, // $1000 por 1kg
    units_per_price: 50,
    price_type: "MINOR",
    profit_percentage: 10, // 10% off a partir de 2kg
    logic_type: "QUANTITY_DISCOUNT",
    observations: null,
    is_limited_offer: false,
    is_active: true,
    valid_from: "2025-09-01T00:00:00Z",
    valid_until: null,
    created_at: "2025-09-01T10:00:00Z",
    updated_at: null,
  },

  // MINOR + QUANTITY_DISCOUNT (ejemplo 2)
  {
    price_id: 3,
    lot_id: 1001,
    price_number: 2,
    unit_price: 2700, // $2700 por 3kg (10% off acumulado)
    units_per_price: 40,
    price_type: "MINOR",
    profit_percentage: 20, // 20% off total
    logic_type: "QUANTITY_DISCOUNT",
    observations: "Pack familiar",
    is_limited_offer: false,
    is_active: true,
    valid_from: "2025-09-01T00:00:00Z",
    valid_until: null,
    created_at: "2025-09-01T10:00:00Z",
    updated_at: null,
  },

  // MINOR + LIMITED_OFFER
  {
    price_id: 4,
    lot_id: 1001,
    price_number: 4,
    unit_price: 800,
    units_per_price: 15,
    price_type: "MINOR",
    profit_percentage: 0,
    logic_type: "LIMITED_OFFER",
    observations: "Solo válido el fin de semana",
    is_limited_offer: true,
    is_active: true,
    valid_from: "2025-09-05T00:00:00Z",
    valid_until: "2025-09-07T23:59:59Z",
    created_at: "2025-09-04T18:00:00Z",
    updated_at: null,
  },

  // =========================
  // MAYOR
  // =========================

  // MAYOR + SPECIAL
  {
    price_id: 5,
    lot_id: 1002,
    price_number: 1,
    unit_price: 8500, // 10kg pack con precio especial
    units_per_price: 20,
    price_type: "MAYOR",
    profit_percentage: 0,
    logic_type: "SPECIAL",
    observations: "Precio exclusivo para clientes mayoristas fidelizados",
    is_limited_offer: false,
    is_active: true,
    valid_from: "2025-09-01T00:00:00Z",
    valid_until: null,
    created_at: "2025-09-01T12:00:00Z",
    updated_at: null,
  },

  // MAYOR + QUANTITY_DISCOUNT (ejemplo 1)
  {
    price_id: 6,
    lot_id: 1002,
    price_number: 2,
    unit_price: 16000, // $16000 por 20kg
    units_per_price: 60,
    price_type: "MAYOR",
    profit_percentage: 10, // 10% off desde 20kg
    logic_type: "QUANTITY_DISCOUNT",
    observations: null,
    is_limited_offer: false,
    is_active: true,
    valid_from: "2025-09-01T00:00:00Z",
    valid_until: null,
    created_at: "2025-09-01T12:00:00Z",
    updated_at: null,
  },

  // MAYOR + QUANTITY_DISCOUNT (ejemplo 2)
  {
    price_id: 7,
    lot_id: 1002,
    price_number: 3,
    unit_price: 38000, // $38000 por 50kg (más descuento acumulado)
    units_per_price: 30,
    price_type: "MAYOR",
    profit_percentage: 20, // 20% off total
    logic_type: "QUANTITY_DISCOUNT",
    observations: "Precio de bulto cerrado",
    is_limited_offer: false,
    is_active: true,
    valid_from: "2025-09-01T00:00:00Z",
    valid_until: null,
    created_at: "2025-09-01T12:00:00Z",
    updated_at: null,
  },

  // MAYOR + LIMITED_OFFER
  {
    price_id: 8,
    lot_id: 1002,
    price_number: 4,
    unit_price: 7500, // oferta puntual de 10kg
    units_per_price: 10,
    price_type: "MAYOR",
    profit_percentage: 0,
    logic_type: "LIMITED_OFFER",
    observations: "Promoción lanzamiento",
    is_limited_offer: true,
    is_active: true,
    valid_from: "2025-09-01T00:00:00Z",
    valid_until: "2025-09-03T23:59:59Z",
    created_at: "2025-09-01T12:00:00Z",
    updated_at: null,
  },
];

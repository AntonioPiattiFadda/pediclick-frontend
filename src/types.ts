// Enums
export type UserRoleEnum = "buyer" | "seller" | "admin" | "moderator";

export type UnitTypeEnum =
  | "weight"
  | "volume"
  | "quantity"
  | "length"
  | "area"
  | "custom";

export type ProductStatusEnum =
  | "draft"
  | "active"
  | "inactive"
  | "out_of_stock"
  | "discontinued";

export type PromotionTypeEnum = "product" | "category" | "store" | "shipping";

export type DiscountTypeEnum = "percentage" | "fixed_amount";

// Helpers para campos JSONB
export type Address = string;
// {
//   street?: string;
//   city?: string;
//   province?: string;
//   country?: string;
//   postal_code?: string;
//   references?: string;
//   [key: string]: unknown;
// }

export interface Dimensions {
  length?: number;
  width?: number;
  height?: number;
  unit?: string;
}

export interface Attributes {
  [key: string]: string | number | boolean;
}

export type SocialLinks = string;
// {
//   facebook?: string;
//   instagram?: string;
//   tiktok?: string;
//   linkedin?: string;
//   [key: string]: string | undefined;
// }

export type OpeningHours = string;
// {
//   [day: string]: { from: string; to: string }[];
// }

export interface HomepageLayoutSection {
  type: string;
  order: number;
  [key: string]: unknown;
}

// Interfaces para tablas

export interface Category {
  category_id: string;
  category_name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  business_owner_id: string | null;
}

export interface SubCategory {
  sub_category_id: string;
  sub_category_name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  business_owner_id: string | null;
}

export interface Unit {
  id: string;
  name: string;
  symbol: string;
  base_unit_id?: string | null;
  conversion_factor?: number;
  unit_type: UnitTypeEnum;
  is_system_unit?: boolean;
  created_by?: string;
  created_at?: string;
}

export type Price = {
  price: string;
  quantity: string;
  type: "PRIMARY" | "SECONDARY"; // Asumiendo que puede haber otros tipos además de PRIMARY
};

export type Stock = {
  quantity: number;
  min: number;
  max: number;
};

export type BaseLot = {
  expiration_date: string;
  expiration_date_notification: boolean;
  lot: string;
  bulk: string;
  waste: string;
  provider_id: number | null;

  providers?: {
    provider_name: string;
  };

  prices: Price[];
};

export type LotWithControl = BaseLot & {
  lot_control: true;
  stock: Stock;
};

export type LotWithoutControl = BaseLot & {
  lot_control: false;
};

export type Lot = LotWithControl | LotWithoutControl;

export interface Product {
  short_code: number | null;
  product_name: string;
  category_id: number | null;
  sub_category_id: number | null;
  brand_id: number | null;
  sale_unit_id: number | null;
  barcode: number | null;
  public_image_id: number | null;
  store_id: number | null;
  allow_stock_control: boolean;
  lot_control: boolean;
  lots: Lot[];

  public_images?: {
    public_image_src: string;
  };
  categories?: {
    category_name: string;
  };
  sub_categories?: {
    sub_category_name: string;
  };
  
  brands?: {
    brand_name: string;
  };
  sale_units?: {
    sale_unit_name: string;
  };
}

export interface WebsitePreference {
  id: string;
  theme?: string;
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  favicon_url?: string;
  homepage_layout?: HomepageLayoutSection[];
  custom_css?: string;
  language?: string;
  currency?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Store {
  store_id: number;
  store_name: string;
  description: string;
  address: Address;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  social_links: SocialLinks;
  opening_hours: OpeningHours;
  updated_at?: string;
  deleted_at: string | null;
  business_owner_id: string;
  slug: string;
}

export interface UserProfile {
  id: string;
  email: string;
  password?: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
  phone: string | null;
  address: Address | null;
  is_verified: boolean;
  parent_user_id: string;
  store_id: number;
  job_position: string | null;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Provider {
  provider_id: string;
  provider_name: string;
  business_owner_id: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Brand {
  brand_id: string;
  brand_name: string;
  business_owner_id: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface SaleUnit {
  sale_unit_id: string;
  sale_unit_name: string;
  business_owner_id: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

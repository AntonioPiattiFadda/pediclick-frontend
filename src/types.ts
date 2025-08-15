// Enums
export type UserRoleEnum = 'buyer' | 'seller' | 'admin' | 'moderator';

export type UnitTypeEnum = 'weight' | 'volume' | 'quantity' | 'length' | 'area' | 'custom';

export type ProductStatusEnum = 'draft' | 'active' | 'inactive' | 'out_of_stock' | 'discontinued';

export type PromotionTypeEnum = 'product' | 'category' | 'store' | 'shipping';

export type DiscountTypeEnum = 'percentage' | 'fixed_amount';

// Helpers para campos JSONB
export interface Address {
  street?: string;
  city?: string;
  province?: string;
  country?: string;
  postal_code?: string;
  references?: string;
  [key: string]: unknown;
}

export interface Dimensions {
  length?: number;
  width?: number;
  height?: number;
  unit?: string;
}

export interface Attributes {
  [key: string]: string | number | boolean;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
  [key: string]: string | undefined;
}

export interface OpeningHours {
  [day: string]: { from: string; to: string }[];
}

export interface HomepageLayoutSection {
  type: string;
  order: number;
  [key: string]: unknown;
}

// Interfaces para tablas

export interface UserProfile {
  id: string; // UUID
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  address?: Address; // JSONB
  user_type: UserRoleEnum;
  is_verified?: boolean;
  tax_id?: string;
  business_name?: string;
  created_at?: string; // ISO Date string
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string | null;
  image_url?: string;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  created_by?: string;
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

export interface Product {
  id: string;
  seller_id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  sku?: string;
  brand?: string;
  status?: ProductStatusEnum;
  is_digital?: boolean;
  weight?: number;
  dimensions?: Dimensions;
  tags?: string[];
  seo_title?: string;
  seo_description?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  product_images?: ProductImage[];
  product_prices?: ProductPrice[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku?: string;
  attributes: Attributes;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ProductPrice {
  id: string;
  product_id: string;
  variant_id?: string | null;
  unit_id: string;
  quantity: number;
  price: number;
  currency?: string;
  compare_at_price?: number;
  cost_price?: number;
  is_active?: boolean;
  valid_from?: string;
  valid_until?: string | null;
  created_at?: string;
  updated_at?: string;
  units?: Unit;
}

export interface PriceHistory {
  id: string;
  product_price_id: string;
  old_price: number;
  new_price: number;
  currency: string;
  changed_by?: string;
  reason?: string;
  created_at?: string;
}

export interface Inventory {
  id: string;
  product_id: string;
  variant_id?: string | null;
  unit_id: string;
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_threshold?: number;
  track_inventory?: boolean;
  allow_backorder?: boolean;
  location?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  variant_id?: string | null;
  url: string;
  alt_text?: string;
  sort_order?: number;
  is_primary?: boolean;
  created_at?: string;
}

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  promotion_type: PromotionTypeEnum;
  discount_type: DiscountTypeEnum;
  discount_value: number;
  min_purchase_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  usage_count?: number;
  is_active?: boolean;
  starts_at: string;
  ends_at: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PromotionProduct {
  id: string;
  promotion_id: string;
  product_id: string;
  created_at?: string;
}

export interface BusinessProfile {
  id: string;
  business_name: string;
  description?: string;
  address?: Address;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  social_links?: SocialLinks;
  opening_hours?: OpeningHours;
  created_at?: string;
  updated_at?: string;
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
  store_id: string;
  store_name: string;
  description: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  social_links: SocialLinks;
  opening_hours: OpeningHours;
  updated_at?: string;
  deleted_at: string | null;
  created_by: string;
  slug: string;
}

export interface TeamMember {
  id: string;
  email: string;
  password?: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  is_verified: boolean;
  parent_user_id: string;
  store_id: number;
  job_position: string | null;


  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
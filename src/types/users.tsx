import type { Address } from "./shared";

export interface UserProfile {
  id: string;
  email: string;
  password: string;
  full_name: string;
  role: string;
  phone: string | null;
  address: Address | null;
  is_verified: boolean;
  business_owner_id: string;
  store_id: number | null;
  stock_room_id: number | null;

  short_code: number | null;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;

}
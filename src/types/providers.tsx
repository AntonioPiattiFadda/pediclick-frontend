export interface Provider {
  provider_id: string;
  provider_name: string;
  business_owner_id: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}


export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  role: string;
  is_verified: boolean | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_active: boolean | null;
}

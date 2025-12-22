import type { UserProfile } from "@/types/users";

export const emptyUser: UserProfile = {
    id: "",
    email: "",
    password: "",
    role: "",
    full_name: "",
    address: "",
    phone: "",
    created_at: "",
    updated_at: "",
    deleted_at: "",
    is_verified: false,
    short_code: null,
};
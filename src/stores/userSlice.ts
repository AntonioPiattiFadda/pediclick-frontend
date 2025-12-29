import type { UserProfile } from "@/types/users";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const initialState: UserProfile = {
  id: "",
  email: "",
  full_name: "",
  role: "",
  phone: null,
  address: null,
  is_verified: false,
  business_owner_id: '',
  created_at: "",
  updated_at: "",
  deleted_at: null,
  short_code: null,
  password: '',
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (_state, action: PayloadAction<UserProfile>) => {
      return action.payload; // reemplaza el user actual por el nuevo
    },
    clearUser: () => {
      return initialState; // resetea al estado inicial
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;

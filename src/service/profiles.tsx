/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getLocalStorage,
  removeLocalStorage,
  setLocalStorage,
} from "@/utils/localStorageUtils";
import { getUserId, supabase } from ".";
import type { UserProfile } from "@/types/users";

export const insertNewAdminUser = async (email: string, userUid: string) => {
  const { data, error } = await supabase
    .from("users")
    .insert({
      email,
      role: "OWNER",
      id: userUid,
    })
    .select()
    .single();

  if (error) {
    return { error };
  }

  return { data };
};

export const checkUserExists = async (email: string) => {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  return { userExists: data !== null };
};

export async function createNewUser(email: string, password: string) {
  try {
    const { userExists } = await checkUserExists(email);

    if (userExists) {
      const error = new Error("");
      error.message = "El email ya está en uso";
      error.name = "ConflictError";
      throw error;
    }

    const {
      data: { session: adminSession },
    } = await supabase.auth.getSession();

    if (!adminSession) {
      const error = new Error("");
      error.message =
        "No hay sesión activa de administrador, intenta hacer el login nuevamente";
      throw error;
    }

    const authSessionStorage = {
      access_token: adminSession.access_token,
      refresh_token: adminSession.refresh_token,
    };

    setLocalStorage("authSession", authSessionStorage);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    interface AuthSession {
      access_token: string;
      refresh_token: string;
    }

    const authSession = getLocalStorage("authSession") as AuthSession | null;
    removeLocalStorage("authSession");

    if (
      authSession &&
      typeof authSession.access_token === "string" &&
      typeof authSession.refresh_token === "string"
    ) {
      try {
        await supabase.auth.setSession({
          access_token: authSession.access_token,
          refresh_token: authSession.refresh_token,
        });
      } catch (error) {
        console.error("Error restoring admin session:", error);
      }
    }

    if (error) {
      return {
        error: error,
        data: null,
      };
    }

    if (!data.user) {
      return {
        error: { message: "No se pudo crear el usuario." },
        data: null,
      };
    }

    return {
      data: data.user,
      error: null,
    };
  } catch (error) {
    console.error("Error creating new user:", error);
    throw error;
  }
}

export const getParentUserId = async (userId: string) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("business_owner_id")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return user?.business_owner_id;
};

export const getBusinessOwnerId = async () => {
  const userId = await getUserId();
  const { data: userData, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  //FIXME aca hago una llamada extra pero es mas seguro
  const businessOwnerId =
    userData.role === "OWNER" ? userId : userData.business_owner_id;

  return businessOwnerId;
};

// const getBusinessOwnerId = async (storeId: number) => {
//   const { data: store, error } = await supabase
//     .from("stores")
//     .select("business_owner_id")
//     .eq("store_id", storeId)
//     .single();

//   if (error) {
//     throw new Error(error.message);
//   }

//   return store?.business_owner_id;
// };

export const getUserTeamMembers = async () => {
  const businessOwnerId = await getBusinessOwnerId();

  const { data: teamMembers, error } = await supabase
    .from("users")
    .select("*")
    .eq("business_owner_id", businessOwnerId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  return { teamMembers, error };
};

export const createTeamMember = async (newUserData: Omit<UserProfile, "id" | "is_verified">) => {
  const businessOwnerId = await getBusinessOwnerId();

  const { error: createUserError, data: user } = await createNewUser(
    newUserData.email,
    newUserData.password
  );

  const newUserUID = user?.id;

  if (createUserError) {
    const error = new Error("");
    error.message = createUserError.message;
    throw error;
  }

  if (!newUserUID) {
    const error = new Error("");
    error.message = "No se pudo crear el usuario de autenticación.";
    throw error;
  }

  const newUserDataFormatted: Omit<UserProfile, "password"> = {
    id: newUserUID,
    email: newUserData.email,
    role: 'EMPLOYEE',
    full_name: newUserData.full_name,
    address: newUserData.address,
    phone: newUserData.phone,
    is_verified: false,
    business_owner_id: businessOwnerId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    short_code: newUserData.short_code,
  };

  const { data, error: newUserError } = await supabase
    .from("users")
    .insert({
      ...newUserDataFormatted,
    })
    .select()
    .single();

  if (newUserError) {
    const error = new Error("");
    error.message = newUserError.message;
    throw error;
  }

  return { data, newUserError };
};

export const getUserDataByUid = async () => {
  const uid = await getUserId();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", uid)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { data, error };
};

export const getTeamMemberDataById = async (uid: string) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", uid)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { data, error };
};

export const editTeamMember = async (newUserData: any) => {
  const { data, error } = await supabase
    .from("users")
    .update({ ...newUserData })
    .eq("id", newUserData.id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { data, error };
};

export const deleteTeamMember = async (id: string) => {
  const { data, error } = await supabase
    .from("users")
    .update({ deleted_at: new Date() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { data, error };
};

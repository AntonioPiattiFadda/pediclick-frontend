import { supabase } from ".";
import { checkUserExists, insertNewAdminUser } from "./profiles";

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
};

export const signUp = async (email: string, password: string) => {
  const { userExists } = await checkUserExists(email);

  if (userExists) {
    const error = new Error("");
    error.message = "El email ya está en uso.";
    error.name = "ConflictError";
    throw error;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("User information is missing from sign up response.");
  }
  const newUserUID = data.user.id;

  const { error: profileError } = await insertNewAdminUser(email, newUserUID);

  if (profileError) {
    throw new Error(profileError.message);
  }

  return data;
};

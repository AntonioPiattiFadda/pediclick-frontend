import { supabase } from ".";

export const getPublicImages = async () => {
  const { data: images, error } = await supabase
    .from("public_images")
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return { images, error };
};

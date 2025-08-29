import { supabase } from ".";

export const getPublicImages = async () => {
  const { data: images, error } = await supabase
    .from("public_images")
    .select("*");
    console.log("images", images);

  if (error) {
    throw new Error(error.message);
  }

  return { images, error };
};

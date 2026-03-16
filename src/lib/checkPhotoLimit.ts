import { supabase } from "@/lib/supabaseClient";

interface PhotoLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
}

export const checkPhotoLimit = async (
  memorialId: string,
  userId: string
): Promise<PhotoLimitResult> => {
  const { data, error } = await supabase.functions.invoke("check-photo-limit", {
    body: { memorial_id: memorialId, user_id: userId },
  });

  if (error) {
    console.error("check-photo-limit error:", error);
    // Allow upload on error to avoid blocking users
    return { allowed: true, current: 0, limit: -1 };
  }

  return data as PhotoLimitResult;
};

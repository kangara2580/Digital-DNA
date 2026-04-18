import type { SupabaseClient } from "@supabase/supabase-js";

export type FavoriteKind = "wishlist" | "like";

export type FavoriteRow = {
  id: string;
  user_id: string;
  video_id: string;
  kind: FavoriteKind;
  created_at: string;
};

export async function fetchUserFavorites(
  supabase: SupabaseClient,
  userId: string,
): Promise<FavoriteRow[]> {
  try {
    const { data, error } = await supabase
      .from("favorites")
      .select("id,user_id,video_id,kind,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as FavoriteRow[];
  } catch {
    return [];
  }
}

export async function addFavorite(
  supabase: SupabaseClient,
  userId: string,
  videoId: string,
  kind: FavoriteKind,
  createdAtMs?: number,
): Promise<boolean> {
  try {
    const payload: Record<string, unknown> = {
      user_id: userId,
      video_id: videoId,
      kind,
    };
    if (createdAtMs != null && Number.isFinite(createdAtMs)) {
      payload.created_at = new Date(createdAtMs).toISOString();
    }

    const { error } = await supabase.from("favorites").insert(payload);
    if (!error) return true;
    if ((error as { code?: string }).code === "23505") return true;
    return false;
  } catch {
    return false;
  }
}

export async function removeFavorite(
  supabase: SupabaseClient,
  userId: string,
  videoId: string,
  kind: FavoriteKind,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("video_id", videoId)
      .eq("kind", kind);

    return !error;
  } catch {
    return false;
  }
}

export async function removeAllWishlistForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("kind", "wishlist");

    return !error;
  } catch {
    return false;
  }
}

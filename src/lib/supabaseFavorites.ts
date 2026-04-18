import type { SupabaseClient } from "@supabase/supabase-js";

export type FavoriteKind = "wishlist" | "like";

export type FavoriteRow = {
  id: string;
  user_id: string;
  video_id: string;
  kind: FavoriteKind;
  created_at: string;
};

/** Supabase 테이블명 (기본 `favorites`). 대시보드에서 `user_favorites`만 쓰는 경우 .env에 맞춤 */
export function getFavoritesTableName(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_FAVORITES_TABLE?.trim() || "favorites"
  );
}

export type FetchFavoritesResult =
  | { ok: true; rows: FavoriteRow[] }
  | { ok: false; errorMessage: string; errorCode?: string };

export async function fetchUserFavorites(
  supabase: SupabaseClient,
  userId: string,
): Promise<FetchFavoritesResult> {
  const table = getFavoritesTableName();
  try {
    const { data, error } = await supabase
      .from(table)
      .select("id,user_id,video_id,kind,created_at")
      .eq("user_id", userId)
      .eq("kind", "wishlist")
      .order("created_at", { ascending: false });

    if (error) {
      return {
        ok: false,
        errorMessage: error.message,
        errorCode: error.code,
      };
    }
    return { ok: true, rows: (data ?? []) as FavoriteRow[] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, errorMessage: msg };
  }
}

export type MutateFavoriteResult =
  | { ok: true }
  | { ok: false; errorMessage: string; errorCode?: string };

export async function addFavorite(
  supabase: SupabaseClient,
  userId: string,
  videoId: string,
  kind: FavoriteKind,
  createdAtMs?: number,
): Promise<MutateFavoriteResult> {
  const table = getFavoritesTableName();
  try {
    const payload: Record<string, unknown> = {
      user_id: userId,
      video_id: videoId,
      kind,
    };
    if (createdAtMs != null && Number.isFinite(createdAtMs)) {
      payload.created_at = new Date(createdAtMs).toISOString();
    }

    const { error } = await supabase.from(table).insert(payload);
    if (!error) return { ok: true };
    if (error.code === "23505") return { ok: true };
    if (process.env.NODE_ENV === "development") {
      console.warn("[wishlist] insert failed", {
        table,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
    }
    return {
      ok: false,
      errorMessage: error.message,
      errorCode: error.code,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (process.env.NODE_ENV === "development") {
      console.warn("[wishlist] insert exception", { table, msg });
    }
    return { ok: false, errorMessage: msg };
  }
}

export async function removeFavorite(
  supabase: SupabaseClient,
  userId: string,
  videoId: string,
  kind: FavoriteKind,
): Promise<MutateFavoriteResult> {
  const table = getFavoritesTableName();
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("user_id", userId)
      .eq("video_id", videoId)
      .eq("kind", kind);

    if (!error) return { ok: true };
    if (process.env.NODE_ENV === "development") {
      console.warn("[wishlist] delete failed", {
        table,
        code: error.code,
        message: error.message,
      });
    }
    return {
      ok: false,
      errorMessage: error.message,
      errorCode: error.code,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, errorMessage: msg };
  }
}

export async function removeAllWishlistForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const table = getFavoritesTableName();
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("user_id", userId)
      .eq("kind", "wishlist");

    return !error;
  } catch {
    return false;
  }
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeedVideo } from "@/data/videos";
import { getCartTableName, supabaseTables } from "@/lib/supabaseTableNames";

export const STUDIO_HISTORY_BLOB_KEY = "studio_history";

/** RecentClipsContext 항목과 동일 형태(순환 import 방지) */
export type RecentClipEntrySync = { id: string; viewedAt: number };

function isFeedVideo(v: unknown): v is FeedVideo {
  if (!v || typeof v !== "object") return false;
  const o = v as FeedVideo;
  return typeof o.id === "string" && typeof o.title === "string";
}

/** DB jsonb가 예전 형식이어도 id·제목을 복구해 새로고침 후에도 목록이 비지 않게 함 */
function normalizeCartVideoPayload(
  video: unknown,
  fallbackVideoId: string,
): FeedVideo | null {
  if (!video || typeof video !== "object") return null;
  const o = video as Record<string, unknown>;
  const id =
    typeof o.id === "string" && o.id.length > 0 ? o.id : fallbackVideoId;
  if (typeof id !== "string" || id.length === 0) return null;
  const title = typeof o.title === "string" ? o.title : "";
  const base = { ...o, id, title } as FeedVideo;
  return isFeedVideo(base) ? base : null;
}

export type FetchCartVideosResult =
  | { ok: true; videos: FeedVideo[] }
  | { ok: false; errorMessage: string; errorCode?: string };

/** 장바구니: 서버에서 영상 순서대로 로드 */
export async function fetchUserCartVideos(
  supabase: SupabaseClient,
  userId: string,
): Promise<FetchCartVideosResult> {
  try {
    const { data, error } = await supabase
      .from(getCartTableName())
      .select("video_id,video,sort_index")
      .eq("user_id", userId)
      .order("sort_index", { ascending: true });

    if (error) {
      return {
        ok: false,
        errorMessage: error.message,
        errorCode: error.code,
      };
    }
    const rows = (data ?? []) as {
      video_id: string;
      video: unknown;
    }[];
    const videos = rows
      .map((r) => normalizeCartVideoPayload(r.video, r.video_id))
      .filter((v): v is FeedVideo => v != null);
    /** 행은 있는데 파싱이 전부 실패하면 ok로 두면 빈 동기화로 DB가 지워질 수 있음 */
    if (rows.length > 0 && videos.length === 0) {
      return {
        ok: false,
        errorMessage:
          "장바구니 행은 있으나 영상 정보를 읽을 수 없습니다. video 컬럼 형식을 확인해 주세요.",
      };
    }
    return { ok: true, videos };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, errorMessage: msg };
  }
}

export async function replaceUserCart(
  supabase: SupabaseClient,
  userId: string,
  videos: FeedVideo[],
): Promise<boolean> {
  try {
    const { error: delErr } = await supabase
      .from(getCartTableName())
      .delete()
      .eq("user_id", userId);
    if (delErr) return false;
    if (videos.length === 0) return true;
    const rows = videos.map((v, i) => ({
      user_id: userId,
      video_id: v.id,
      video: v,
      sort_index: i,
    }));
    const { error: insErr } = await supabase
      .from(getCartTableName())
      .insert(rows);
    return !insErr;
  } catch {
    return false;
  }
}

export async function fetchUserRecentViews(
  supabase: SupabaseClient,
  userId: string,
  limit = 100,
): Promise<RecentClipEntrySync[]> {
  try {
    const { data, error } = await supabase
      .from(supabaseTables.recentViews)
      .select("video_id,viewed_at")
      .eq("user_id", userId)
      .order("viewed_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return (data as { video_id: string; viewed_at: string }[]).map((r) => {
      const t = Date.parse(r.viewed_at);
      return {
        id: r.video_id,
        viewedAt: Number.isFinite(t) ? t : Date.now(),
      };
    });
  } catch {
    return [];
  }
}

export async function replaceUserRecentViews(
  supabase: SupabaseClient,
  userId: string,
  entries: RecentClipEntrySync[],
): Promise<boolean> {
  try {
    const { error: delErr } = await supabase
      .from(supabaseTables.recentViews)
      .delete()
      .eq("user_id", userId);
    if (delErr) return false;
    if (entries.length === 0) return true;
    const rows = entries.map((e) => ({
      user_id: userId,
      video_id: e.id,
      viewed_at: new Date(e.viewedAt).toISOString(),
    }));
    const { error: insErr } = await supabase
      .from(supabaseTables.recentViews)
      .insert(rows);
    return !insErr;
  } catch {
    return false;
  }
}

export async function fetchUserPurchasedIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from(supabaseTables.demoPurchases)
      .select("video_id")
      .eq("user_id", userId);

    if (error || !data) return [];
    return (data as { video_id: string }[]).map((r) => r.video_id);
  } catch {
    return [];
  }
}

export async function addUserPurchasedVideo(
  supabase: SupabaseClient,
  userId: string,
  videoId: string,
): Promise<boolean> {
  try {
    const { error } = await supabase.from(supabaseTables.demoPurchases).upsert(
      { user_id: userId, video_id: videoId },
      { onConflict: "user_id,video_id" },
    );
    return !error;
  } catch {
    return false;
  }
}

export async function replaceUserDemoPurchases(
  supabase: SupabaseClient,
  userId: string,
  videoIds: string[],
): Promise<boolean> {
  try {
    const { error: delErr } = await supabase
      .from(supabaseTables.demoPurchases)
      .delete()
      .eq("user_id", userId);
    if (delErr) return false;
    if (videoIds.length === 0) return true;
    const rows = videoIds.map((video_id) => ({ user_id: userId, video_id }));
    const { error: insErr } = await supabase
      .from(supabaseTables.demoPurchases)
      .insert(rows);
    return !insErr;
  } catch {
    return false;
  }
}

export async function upsertCustomizeDraftRemote(
  supabase: SupabaseClient,
  userId: string,
  videoId: string,
  payload: unknown,
): Promise<boolean> {
  try {
    const { error } = await supabase.from(supabaseTables.customizeDrafts).upsert(
      {
        user_id: userId,
        video_id: videoId,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,video_id" },
    );
    return !error;
  } catch {
    return false;
  }
}

export async function deleteCustomizeDraftRemote(
  supabase: SupabaseClient,
  userId: string,
  videoId: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(supabaseTables.customizeDrafts)
      .delete()
      .eq("user_id", userId)
      .eq("video_id", videoId);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchUserCustomizeDrafts(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ video_id: string; payload: unknown; updated_at: string }[]> {
  try {
    const { data, error } = await supabase
      .from(supabaseTables.customizeDrafts)
      .select("video_id,payload,updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error || !data) return [];
    return data as { video_id: string; payload: unknown; updated_at: string }[];
  } catch {
    return [];
  }
}

export async function fetchCustomizeDraftByVideoId(
  supabase: SupabaseClient,
  userId: string,
  videoId: string,
): Promise<{ payload: unknown; updated_at: string } | null> {
  try {
    const { data, error } = await supabase
      .from(supabaseTables.customizeDrafts)
      .select("payload,updated_at")
      .eq("user_id", userId)
      .eq("video_id", videoId)
      .maybeSingle();

    if (error || !data) return null;
    return data as { payload: unknown; updated_at: string };
  } catch {
    return null;
  }
}

export async function fetchUserDataBlob(
  supabase: SupabaseClient,
  userId: string,
  blobKey: string,
): Promise<unknown | null> {
  try {
    const { data, error } = await supabase
      .from(supabaseTables.dataBlobs)
      .select("data")
      .eq("user_id", userId)
      .eq("blob_key", blobKey)
      .maybeSingle();

    if (error || !data) return null;
    return (data as { data: unknown }).data;
  } catch {
    return null;
  }
}

export async function upsertUserDataBlob(
  supabase: SupabaseClient,
  userId: string,
  blobKey: string,
  data: unknown,
): Promise<boolean> {
  try {
    const { error } = await supabase.from(supabaseTables.dataBlobs).upsert(
      {
        user_id: userId,
        blob_key: blobKey,
        data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,blob_key" },
    );
    return !error;
  } catch {
    return false;
  }
}


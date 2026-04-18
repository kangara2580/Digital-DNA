import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeedVideo } from "@/data/videos";

export const STUDIO_HISTORY_BLOB_KEY = "studio_history";

/** RecentClipsContext 항목과 동일 형태(순환 import 방지) */
export type RecentClipEntrySync = { id: string; viewedAt: number };

function isFeedVideo(v: unknown): v is FeedVideo {
  if (!v || typeof v !== "object") return false;
  const o = v as FeedVideo;
  return typeof o.id === "string" && typeof o.title === "string";
}

/** 장바구니: 서버에서 영상 순서대로 로드 */
export async function fetchUserCartVideos(
  supabase: SupabaseClient,
  userId: string,
): Promise<FeedVideo[]> {
  try {
    const { data, error } = await supabase
      .from("user_cart_items")
      .select("video,sort_index")
      .eq("user_id", userId)
      .order("sort_index", { ascending: true });

    if (error || !data) return [];
    return (data as { video: unknown }[])
      .map((r) => r.video)
      .filter(isFeedVideo);
  } catch {
    return [];
  }
}

export async function replaceUserCart(
  supabase: SupabaseClient,
  userId: string,
  videos: FeedVideo[],
): Promise<boolean> {
  try {
    const { error: delErr } = await supabase
      .from("user_cart_items")
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
    const { error: insErr } = await supabase.from("user_cart_items").insert(rows);
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
      .from("user_recent_views")
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
      .from("user_recent_views")
      .delete()
      .eq("user_id", userId);
    if (delErr) return false;
    if (entries.length === 0) return true;
    const rows = entries.map((e) => ({
      user_id: userId,
      video_id: e.id,
      viewed_at: new Date(e.viewedAt).toISOString(),
    }));
    const { error: insErr } = await supabase.from("user_recent_views").insert(rows);
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
      .from("user_demo_purchases")
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
    const { error } = await supabase.from("user_demo_purchases").upsert(
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
      .from("user_demo_purchases")
      .delete()
      .eq("user_id", userId);
    if (delErr) return false;
    if (videoIds.length === 0) return true;
    const rows = videoIds.map((video_id) => ({ user_id: userId, video_id }));
    const { error: insErr } = await supabase
      .from("user_demo_purchases")
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
    const { error } = await supabase.from("user_customize_drafts").upsert(
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
      .from("user_customize_drafts")
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
      .from("user_customize_drafts")
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
      .from("user_customize_drafts")
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
      .from("user_data_blobs")
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
    const { error } = await supabase.from("user_data_blobs").upsert(
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


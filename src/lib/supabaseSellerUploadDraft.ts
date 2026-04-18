import type { SupabaseClient } from "@supabase/supabase-js";

export type SellerUploadDraftPayload = {
  sourceType: "file" | "url";
  videoUrl: string;
  title: string;
  description: string;
  hashtags: string;
  price: string;
  isAi: boolean;
  editionKind: "open" | "limited";
  editionCap: string;
  rights: boolean;
  confirmOriginal: boolean;
  durationSec: number | null;
  orientation: "portrait" | "landscape";
  /** 파일은 저장하지 않음 — 복원 시 다시 선택 필요 */
  hadLocalFile: boolean;
};

export async function fetchSellerUploadDraft(
  supabase: SupabaseClient,
  userId: string,
): Promise<SellerUploadDraftPayload | null> {
  try {
    const { data, error } = await supabase
      .from("seller_upload_drafts")
      .select("payload")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data?.payload) return null;
    return data.payload as SellerUploadDraftPayload;
  } catch {
    return null;
  }
}

export async function upsertSellerUploadDraft(
  supabase: SupabaseClient,
  userId: string,
  payload: SellerUploadDraftPayload,
): Promise<boolean> {
  try {
    const { error } = await supabase.from("seller_upload_drafts").upsert(
      {
        user_id: userId,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    return !error;
  } catch {
    return false;
  }
}

export async function deleteSellerUploadDraft(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("seller_upload_drafts")
      .delete()
      .eq("user_id", userId);
    return !error;
  } catch {
    return false;
  }
}

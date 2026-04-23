import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseTables } from "@/lib/supabaseTableNames";

export type SellerUploadDraftPayload = {
  sourceType: "file" | "url";
  videoUrl: string;
  title: string;
  description: string;
  hashtags: string;
  category: string;
  price: string;
  isAi: boolean;
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
      .from(supabaseTables.sellerUploadDrafts)
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
    const { error } = await supabase.from(supabaseTables.sellerUploadDrafts).upsert(
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
      .from(supabaseTables.sellerUploadDrafts)
      .delete()
      .eq("user_id", userId);
    return !error;
  } catch {
    return false;
  }
}

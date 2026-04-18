import { dispatchCustomizeDraftsUpdated } from "@/lib/customizeDraftStorage";

export type SavedCustomizeDraftItem = {
  videoId: string;
  savedAt: number;
};

export const CUSTOMIZE_DRAFT_INDEX_STORAGE_KEY = "reels-customize-saved-index-v1";

/** @deprecated Supabase `user_customize_drafts` 를 사용합니다. */
export function readSavedCustomizeDraftIndex(): SavedCustomizeDraftItem[] {
  return [];
}

/** 임시 저장 후 마이페이지 목록 갱신 이벤트만 발생 */
export function markCustomizeDraftSaved(_videoId: string) {
  dispatchCustomizeDraftsUpdated();
}

/** @deprecated */
export function removeSavedCustomizeDraft(_videoId: string) {
  dispatchCustomizeDraftsUpdated();
}

/** @deprecated */
export function pruneOrphanCustomizeDraftIndex() {
  /* no-op */
}

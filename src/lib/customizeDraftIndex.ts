import {
  dispatchCustomizeDraftsUpdated,
  getCustomizeDraftStorageKey,
} from "@/lib/customizeDraftStorage";

export type SavedCustomizeDraftItem = {
  videoId: string;
  savedAt: number;
};

export const CUSTOMIZE_DRAFT_INDEX_STORAGE_KEY = "reels-customize-saved-index-v1";
const STORAGE_KEY = CUSTOMIZE_DRAFT_INDEX_STORAGE_KEY;

export function readSavedCustomizeDraftIndex(): SavedCustomizeDraftItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => {
        if (!x || typeof x !== "object") return null;
        const obj = x as Partial<SavedCustomizeDraftItem>;
        if (typeof obj.videoId !== "string" || typeof obj.savedAt !== "number") {
          return null;
        }
        return { videoId: obj.videoId, savedAt: obj.savedAt };
      })
      .filter((x): x is SavedCustomizeDraftItem => x !== null)
      .sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

export function markCustomizeDraftSaved(videoId: string) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const next = readSavedCustomizeDraftIndex().filter((x) => x.videoId !== videoId);
  next.unshift({ videoId, savedAt: now });
  // 리스트가 너무 길어지지 않게 최근 60개만 유지
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, 60)));
  dispatchCustomizeDraftsUpdated();
}

/** 인덱스 + 본문(`reels-customize-draft-{id}`) 함께 제거 */
export function removeSavedCustomizeDraft(videoId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(getCustomizeDraftStorageKey(videoId));
  } catch {
    /* noop */
  }
  const next = readSavedCustomizeDraftIndex().filter((x) => x.videoId !== videoId);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
  dispatchCustomizeDraftsUpdated();
}

/**
 * 인덱스에는 있는데 본문이 없는 항목 제거(부분 삭제·오류 복구)
 */
export function pruneOrphanCustomizeDraftIndex() {
  if (typeof window === "undefined") return;
  const items = readSavedCustomizeDraftIndex();
  const kept = items.filter((x) => {
    try {
      return Boolean(window.localStorage.getItem(getCustomizeDraftStorageKey(x.videoId)));
    } catch {
      return false;
    }
  });
  if (kept.length === items.length) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(kept));
  } catch {
    /* noop */
  }
  dispatchCustomizeDraftsUpdated();
}

export type SavedCustomizeDraftItem = {
  videoId: string;
  savedAt: number;
};

const STORAGE_KEY = "reels-customize-saved-index-v1";

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
}

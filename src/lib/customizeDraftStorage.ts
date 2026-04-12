/** `PurchaseCustomizeStudio`와 동일한 localStorage 키 */

export const CUSTOMIZE_DRAFT_LS_PREFIX = "reels-customize-draft-";

export function getCustomizeDraftStorageKey(videoId: string): string {
  return `${CUSTOMIZE_DRAFT_LS_PREFIX}${videoId}`;
}

export type CustomizeDraftSummary = {
  backgroundMode: "video" | "image";
  backgroundPrompt: string;
  trimStart: number;
  trimEnd: number;
  overlayCount: number;
  nonEmptyOverlayCount: number;
};

/** 마이페이지 등 — 저장 본문이 있으면 요약(배경·트림·자막 개수) */
export function readCustomizeDraftSummary(videoId: string): CustomizeDraftSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(getCustomizeDraftStorageKey(videoId));
    if (!raw) return null;
    const j = JSON.parse(raw) as Record<string, unknown>;
    if (!j || typeof j !== "object") return null;
    const backgroundMode =
      j.backgroundMode === "image" || j.backgroundMode === "video"
        ? j.backgroundMode
        : "video";
    const backgroundPrompt =
      typeof j.backgroundPrompt === "string" ? j.backgroundPrompt : "";
    const trimStart = typeof j.trimStart === "number" ? j.trimStart : 0;
    const trimEnd = typeof j.trimEnd === "number" ? j.trimEnd : 0;
    const overlays = Array.isArray(j.overlays) ? j.overlays : [];
    const overlayCount = overlays.length;
    const nonEmptyOverlayCount = overlays.filter(
      (o) =>
        o &&
        typeof o === "object" &&
        typeof (o as { text?: string }).text === "string" &&
        (o as { text: string }).text.trim().length > 0,
    ).length;
    return {
      backgroundMode,
      backgroundPrompt,
      trimStart,
      trimEnd,
      overlayCount,
      nonEmptyOverlayCount,
    };
  } catch {
    return null;
  }
}

export function dispatchCustomizeDraftsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("reels-drafts-updated"));
}

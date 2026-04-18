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
export function summarizeCustomizePayload(j: unknown): CustomizeDraftSummary | null {
  if (!j || typeof j !== "object") return null;
  const rec = j as Record<string, unknown>;
  const backgroundMode =
    rec.backgroundMode === "image" || rec.backgroundMode === "video"
      ? rec.backgroundMode
      : "video";
  const backgroundPrompt =
    typeof rec.backgroundPrompt === "string" ? rec.backgroundPrompt : "";
  const trimStart = typeof rec.trimStart === "number" ? rec.trimStart : 0;
  const trimEnd = typeof rec.trimEnd === "number" ? rec.trimEnd : 0;
  const overlays = Array.isArray(rec.overlays) ? rec.overlays : [];
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
}

/** @deprecated — `summarizeCustomizePayload` + DB payload 사용 */
export function readCustomizeDraftSummary(_videoId: string): CustomizeDraftSummary | null {
  return null;
}

export function dispatchCustomizeDraftsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("reels-drafts-updated"));
}

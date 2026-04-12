import { BEST_PURCHASE_REVIEWS } from "@/data/marketing";

/**
 * 「오늘의 베스트 구매평」과 동일한 Notionists 스타일(시드만 다름).
 * @see BestPurchaseReviewsSection
 */
export function buildNotionistsAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear`;
}

export type ReelsAvatarPreset = {
  id: string;
  /** DiceBear seed — 구매평 작성자 핸들과 동일 */
  seed: string;
  label: string;
};

/** 구매평 카드에 쓰인 작성자 시드 — 트렌디한 기본 프로필로 재사용 */
export const BEST_REVIEW_AVATAR_PRESETS: ReelsAvatarPreset[] = (() => {
  const seen = new Set<string>();
  const out: ReelsAvatarPreset[] = [];
  for (const card of BEST_PURCHASE_REVIEWS) {
    const seed = card.author.trim();
    if (!seed || seen.has(seed)) continue;
    seen.add(seed);
    out.push({
      id: `best-review-${card.id}`,
      seed,
      label: seed.replace(/^@/, ""),
    });
  }
  return out;
})();

export const DEFAULT_BEST_REVIEW_AVATAR_SEED =
  BEST_REVIEW_AVATAR_PRESETS[0]?.seed ?? "reels-market";

import { ALL_MARKET_VIDEOS, getVideoCatalogMeta } from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";

/** 판매 성격 — Open(무제한) / Limited / Private(1인) / Batch(N명) */
export type EditionKind = "open" | "limited" | "private" | "batch";

export type VideoCommerceMeta = {
  /** 프로젝트에 복제·사용된 횟수(복제 지수) */
  salesCount: number;
  edition: EditionKind;
  /** limited·batch일 때 최대 판매 수. private는 1로 간주 */
  editionCap?: number;
};

const DEFAULT_COMMERCE: VideoCommerceMeta = {
  salesCount: 612,
  edition: "open",
};

const COMMERCE: Record<string, VideoCommerceMeta> = {
  "1": { salesCount: 1840, edition: "open" },
  "2": { salesCount: 3201, edition: "open" },
  "3": { salesCount: 960, edition: "batch", editionCap: 40 },
  "4": { salesCount: 720, edition: "open" },
  "5": { salesCount: 2402, edition: "open" },
  "6": { salesCount: 0, edition: "private", editionCap: 1 },
  "7": { salesCount: 510, edition: "limited", editionCap: 80 },
  "8": { salesCount: 1402, edition: "open" },
  "9": { salesCount: 2890, edition: "open" },
  "10": { salesCount: 22, edition: "batch", editionCap: 25 },
  "11": { salesCount: 1180, edition: "open" },
  "12": { salesCount: 640, edition: "limited", editionCap: 120 },
  "dna-100-asphalt": { salesCount: 12408, edition: "open" },
  "dna-300-rain-asmr": { salesCount: 7, edition: "batch", editionCap: 10 },
  "dna-500-window-rain": { salesCount: 402, edition: "open" },
  "fail-1": { salesCount: 210, edition: "open" },
  "fail-2": { salesCount: 5, edition: "batch", editionCap: 24 },
  "fail-3": { salesCount: 890, edition: "open" },
  "fail-4": { salesCount: 156, edition: "open" },
  "fail-5": { salesCount: 3, edition: "limited", editionCap: 15 },
  "fail-6": { salesCount: 444, edition: "open" },
};

export function getCommerceMeta(id: string): VideoCommerceMeta {
  return COMMERCE[id] ?? DEFAULT_COMMERCE;
}

export function getEditionCap(meta: VideoCommerceMeta): number | null {
  if (meta.edition === "open") return null;
  if (meta.edition === "private") return 1;
  return meta.editionCap ?? 1;
}

/** 무제한이 아니면 남은 복제·판매 슬롯 */
export function clonesRemaining(meta: VideoCommerceMeta): number | null {
  const cap = getEditionCap(meta);
  if (cap == null) return null;
  return Math.max(0, cap - meta.salesCount);
}

export function isLimitedFamily(edition: EditionKind): boolean {
  return edition !== "open";
}

export type EditionFilter = "all" | "limited" | "open";

export function matchesEditionFilter(
  edition: EditionKind,
  filter: EditionFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "open") return edition === "open";
  return isLimitedFamily(edition);
}

export function isMicroDna(video: Pick<FeedVideo, "priceWon">): boolean {
  return (video.priceWon ?? 999999) <= 300;
}

export function getMarketVideoById(id: string): FeedVideo | undefined {
  return ALL_MARKET_VIDEOS.find((v) => v.id === id);
}

export const ALL_MARKET_VIDEO_IDS = ALL_MARKET_VIDEOS.map((v) => v.id);

export type FreshnessTier = "fresh" | "active" | "archived";

export function getFreshnessFromListedAt(listedAt: string): {
  tier: FreshnessTier;
  label: string;
  subline: string;
} {
  const d = new Date(`${listedAt}T12:00:00`);
  const now = Date.now();
  const days = (now - d.getTime()) / 86400000;
  if (days < 14) {
    return {
      tier: "fresh",
      label: "FRESH",
      subline: "지금 막 올라온 따끈한 조각",
    };
  }
  if (days < 100) {
    return {
      tier: "active",
      label: "",
      subline: "플랫폼에서 유통 중인 기록",
    };
  }
  return {
    tier: "archived",
    label: "ARCHIVED",
    subline: "빈티지 · 레트로 — 오래될수록 이야기가 깊어져요",
  };
}

export function getFreshnessForVideoId(videoId: string) {
  return getFreshnessFromListedAt(getVideoCatalogMeta(videoId).listedAt);
}

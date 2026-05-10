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
  "13": { salesCount: 920, edition: "open" },
  "14": { salesCount: 1540, edition: "open" },
  "15": { salesCount: 780, edition: "open" },
  "16": { salesCount: 410, edition: "open" },
  "17": { salesCount: 1330, edition: "open" },
  "18": { salesCount: 670, edition: "open" },
  "dna-100-asphalt": { salesCount: 12408, edition: "open" },
  "dna-300-rain-asmr": { salesCount: 7, edition: "batch", editionCap: 10 },
  "dna-500-window-rain": { salesCount: 402, edition: "open" },
  "micro-100-neon-bokeh": { salesCount: 2102, edition: "open" },
  "micro-150-river-glint": { salesCount: 980, edition: "open" },
  "micro-200-forest-mist": { salesCount: 756, edition: "open" },
  "micro-200-beach-foam": { salesCount: 1124, edition: "open" },
  "micro-250-rooftop-breeze": { salesCount: 445, edition: "open" },
  "micro-300-night-market": { salesCount: 623, edition: "open" },
  "micro-300-dance-kick": { salesCount: 512, edition: "open" },
  "micro-100-snow-quiet": { salesCount: 3401, edition: "open" },
  "micro-250-village-dawn": { salesCount: 388, edition: "open" },
  "fail-1": { salesCount: 210, edition: "open" },
  "fail-2": { salesCount: 5, edition: "batch", editionCap: 24 },
  "fail-3": { salesCount: 890, edition: "open" },
  "fail-4": { salesCount: 156, edition: "open" },
  "fail-5": { salesCount: 3, edition: "limited", editionCap: 15 },
  "fail-6": { salesCount: 444, edition: "open" },
  "fail-7": { salesCount: 198, edition: "open" },
  "fail-8": { salesCount: 67, edition: "batch", editionCap: 40 },
};

export function getCommerceMeta(id: string): VideoCommerceMeta {
  const raw = COMMERCE[id] ?? DEFAULT_COMMERCE;
  // 정책 변경: 모든 조각은 무제한 판매로 처리
  return {
    salesCount: raw.salesCount,
    edition: "open",
  };
}

export function getEditionCap(meta: VideoCommerceMeta): number | null {
  void meta;
  return null;
}

/** 무제한이 아니면 남은 복제·판매 슬롯 */
export function clonesRemaining(meta: VideoCommerceMeta): number | null {
  void meta;
  return null;
}

export function isLimitedFamily(edition: EditionKind): boolean {
  void edition;
  return false;
}

export type EditionFilter = "all" | "limited" | "open";

export function matchesEditionFilter(
  edition: EditionKind,
  filter: EditionFilter,
): boolean {
  void edition;
  if (filter === "all") return true;
  if (filter === "open") return true;
  return false;
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
      subline: "지금 막 올라온 따끈한 동영상",
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

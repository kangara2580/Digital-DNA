import type { FeedVideo } from "./videos";
import type { CategorySlug } from "./videoCatalog";
import {
  ALL_MARKET_VIDEOS,
  getVideosForCategory,
  sortVideosByNewest,
} from "./videoCatalog";

export type PurchaseReviewPickTone =
  | "rose"
  | "sky"
  | "violet"
  | "amber"
  | "emerald"
  | "fuchsia"
  | "cyan"
  | "orange"
  | "indigo";

export type PurchaseReviewCard = {
  id: string;
  quote: string;
  /** 본문 안에서 형광펜 처리할 부분(정확히 일치하는 문자열) */
  highlightPhrases: string[];
  author: string;
  badge: string;
  /** 상단 컬러 태그 (글로벌 톤) */
  pickLabel: string;
  pickTone: PurchaseReviewPickTone;
  /** 우상단 가격 메리트 (달러 톤) */
  dealBadge: string;
  /** Kling 리스킨 전·후 비교 슬라이더 (데모 이미지) */
  reskinCompare?: { before: string; after: string };
};

export const BEST_PURCHASE_REVIEWS: PurchaseReviewCard[] = [
  {
    id: "rv-1",
    quote:
      "'라면 끓이는 영상' 조각을 브이로그 인트로에 붙였는데 조회수 터졌어요. '이걸 어디다 쓰지?'가 한 번에 해결됐어요.",
    highlightPhrases: ["조회수 터졌어요"],
    author: "@clip_editor_mina",
    badge: "실제 활용 샷",
    pickLabel: "Viral Pick",
    pickTone: "rose",
    dealBadge: "$1 Deal",
    reskinCompare: {
      before: "https://picsum.photos/seed/rv1before/640/360",
      after: "https://picsum.photos/seed/rv1after/640/360",
    },
  },
  {
    id: "rv-2",
    quote:
      "비 오는 창가 클립만 샀는데 숏폼 BGM 구간이랑 무드가 딱 맞아서 재편집 시간이 반으로 줄었습니다.",
    highlightPhrases: ["재편집 시간이 반으로"],
    author: "@shorts_lab",
    badge: "실제 활용 샷",
    pickLabel: "Time Saver",
    pickTone: "sky",
    dealBadge: "Smart Buy",
    reskinCompare: {
      before: "https://picsum.photos/seed/rv2before/640/360",
      after: "https://picsum.photos/seed/rv2after/640/360",
    },
  },
  {
    id: "rv-3",
    quote:
      "'넘어지는 순간' 짤 넣었더니 댓글에 웃음 이모지만 달렸어요. 비싼 스톡보다 반응이 좋았어요.",
    highlightPhrases: ["비싼 스톡보다 반응이 좋았어요"],
    author: "@daily_fail_log",
    badge: "실제 활용 샷",
    pickLabel: "Mood Boost",
    pickTone: "fuchsia",
    dealBadge: "Under $1",
    reskinCompare: {
      before: "https://picsum.photos/seed/rv3before/640/360",
      after: "https://picsum.photos/seed/rv3after/640/360",
    },
  },
  {
    id: "rv-4",
    quote:
      "카페 거품 ASMR 클립으로 제품 소개 영상 첫 3초를 잡았더니 이탈률이 눈에 띄게 줄었어요. 소리 하나로 분위기가 바뀌네요.",
    highlightPhrases: ["이탈률이 눈에 띄게 줄었어요"],
    author: "@brand_slice",
    badge: "실제 활용 샷",
    pickLabel: "Pro's Choice",
    pickTone: "violet",
    dealBadge: "$2 Deal",
  },
  {
    id: "rv-5",
    quote:
      "지하철 안내 방송 직전 정적 2초 클립을 샀는데, 다큐 전환 구간에 넣으니까 긴장감이 확 살아요.",
    highlightPhrases: ["긴장감이 확 살아요"],
    author: "@docu_cut",
    badge: "실제 활용 샷",
    pickLabel: "Story Win",
    pickTone: "amber",
    dealBadge: "Under $2",
  },
  {
    id: "rv-6",
    quote:
      "해변 일몰 타임랩스를 썸네일 배경으로만 썼는데 클릭률이 평소보다 높았어요. 고퀄 영상 한 컷이 효율이 좋아요.",
    highlightPhrases: ["클릭률이 평소보다 높았어요"],
    author: "@thumb_lab",
    badge: "실제 활용 샷",
    pickLabel: "Click Boost",
    pickTone: "cyan",
    dealBadge: "$1 Deal",
  },
  {
    id: "rv-7",
    quote:
      "야시장 불빛 클립을 라이브 방송 인트로에 깔았더니 시청자가 '어디냐'고 물어봤어요. 분위기 연출에 딱이에요.",
    highlightPhrases: ["분위기 연출에 딱이에요"],
    author: "@live_mood",
    badge: "실제 활용 샷",
    pickLabel: "Live Hook",
    pickTone: "orange",
    dealBadge: "Hot Clip",
  },
  {
    id: "rv-8",
    quote:
      "설원 하이킹 풋짐만 샀는데 여행 광고 모의편집에 넣으니 클라이언트가 바로 OK. 짧은 조각이 설득력을 만들어요.",
    highlightPhrases: ["바로 OK", "짧은 조각이 설득력을 만들어요"],
    author: "@pitch_editor",
    badge: "실제 활용 샷",
    pickLabel: "Pitch Ready",
    pickTone: "indigo",
    dealBadge: "Pro Tier",
  },
  {
    id: "rv-9",
    quote:
      "강변 조깅 캠으로 러닝 앱 광고 스토리보드 채웠어요. 직접 찍기엔 날씨·시간이 아까웠는데 한 방에 해결.",
    highlightPhrases: ["한 방에 해결"],
    author: "@ad_story_k",
    badge: "실제 활용 샷",
    pickLabel: "Quick Win",
    pickTone: "emerald",
    dealBadge: "Under $1",
  },
];

/** 상황 큐레이션 한 블록당 최대 클립 수(이후 「더보기」 페이지) */
export const EDITOR_CURATION_CLIP_LIMIT = 30;

/**
 * 카테고리 소속 클립을 최신순으로 채우고, 부족하면 마켓 전체에서 보출한다.
 */
export function getEditorCurationClips(slug: CategorySlug): FeedVideo[] {
  const primary = sortVideosByNewest(getVideosForCategory(slug));
  const seen = new Set<string>();
  const out: FeedVideo[] = [];
  for (const v of primary) {
    if (out.length >= EDITOR_CURATION_CLIP_LIMIT) break;
    if (!seen.has(v.id)) {
      seen.add(v.id);
      out.push(v);
    }
  }
  for (const v of ALL_MARKET_VIDEOS) {
    if (out.length >= EDITOR_CURATION_CLIP_LIMIT) break;
    if (!seen.has(v.id)) {
      seen.add(v.id);
      out.push(v);
    }
  }
  return out.slice(0, EDITOR_CURATION_CLIP_LIMIT);
}

export type EditorCuration = {
  id: string;
  /** 상황에 맞는 짧은 이모지(제목 옆) */
  emoji: string;
  title: string;
  /** 클립 목록·더보기 링크에 사용 */
  categorySlug: CategorySlug;
};

export const EDITOR_CURATIONS: EditorCuration[] = [
  {
    id: "cur-apology",
    emoji: "🙇",
    title: "여자친구한테 혼나서 빌 때 쓰기 좋은 영상 모음",
    categorySlug: "comedy",
  },
  {
    id: "cur-burnout",
    emoji: "😵‍💫",
    title: "밤샘 과제 중 현타 올 때 넣는 짤 모음",
    categorySlug: "daily",
  },
  {
    id: "cur-monday",
    emoji: "🚇",
    title: "월요일 아침 출근길의 지옥철 풍경",
    categorySlug: "shortform",
  },
];

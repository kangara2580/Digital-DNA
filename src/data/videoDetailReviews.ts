/**
 * 조각(동영상) 상세 — 구매평 데모 데이터 (모두 한국어)
 */

export type VideoDetailReview = {
  id: string;
  author: string;
  /** 1–5 */
  rating: number;
  title?: string;
  body: string;
  /** 표시용 날짜 */
  dateLabel: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
};

const R = (n: number) => Math.min(5, Math.max(1, Math.round(n * 2) / 2));

/** videoId → 구매평 (없으면 빈 배열) */
export const VIDEO_DETAIL_REVIEWS: Record<string, VideoDetailReview[]> = {
  "1": [
    {
      id: "vr-1-1",
      author: "미나 · 서울",
      rating: R(5),
      body: "해안 산책 클립을 B-롤 훅으로 썼는데 시청자들이 '어디서 찍었냐'고 물어봤어요. 짧은 영상인데 활용도가 높아요.",
      dateLabel: "2주 전",
      verifiedPurchase: true,
      helpfulCount: 128,
    },
    {
      id: "vr-1-2",
      author: "@clip_editor_mina",
      rating: R(5),
      body: "브이로그 인트로에 붙였는데 분위기가 바로 살아요. 짧은 릴스인데 편집 시간은 확 줄었습니다.",
      dateLabel: "3주 전",
      verifiedPurchase: true,
      helpfulCount: 64,
    },
  ],
  "3": [
    {
      id: "vr-3-1",
      author: "@content_james",
      rating: R(4.5),
      body: "제품 티저에 카페 클립 썼는데 따뜻한 실내 조명이 브랜드 컬러와 딱 맞았어요. 또 구매할 것 같아요.",
      dateLabel: "5일 전",
      verifiedPurchase: true,
      helpfulCount: 42,
    },
    {
      id: "vr-3-2",
      author: "@shorts_lab",
      rating: R(5),
      body: "비 오는 창가 무드가 숏폼이랑 딱 맞았어요. 재편집 시간이 확 줄었습니다.",
      dateLabel: "1개월 전",
      verifiedPurchase: true,
      helpfulCount: 89,
    },
  ],
  "5": [
    {
      id: "vr-5-1",
      author: "@yuki_edit",
      rating: R(5),
      body: "빗소리 창가 영상을 보이스오버 뒤에 깔았는데 앞 5초 시청 유지율이 확 올랐어요. ASMR 감성이 딱이에요.",
      dateLabel: "1주 전",
      verifiedPurchase: true,
      helpfulCount: 56,
    },
    {
      id: "vr-5-2",
      author: "@daily_log",
      rating: R(4),
      body: "짧게 넣기 좋아요. 무거운 스톡보다 반응이 좋았어요.",
      dateLabel: "12일 전",
      verifiedPurchase: true,
      helpfulCount: 31,
    },
  ],
  "7": [
    {
      id: "vr-7-1",
      author: "@live_mood",
      rating: R(5),
      body: "야시장 불빛 클립을 라이브 인트로에 깔았더니 '어디냐'는 댓글이 달렸어요.",
      dateLabel: "4일 전",
      verifiedPurchase: true,
      helpfulCount: 73,
    },
  ],
  "6": [
    {
      id: "vr-6-1",
      author: "@thumb_lab",
      rating: R(4.5),
      body: "해변 일몰을 썸네일 배경으로만 썼는데 클릭률이 평소보다 높았어요.",
      dateLabel: "6일 전",
      verifiedPurchase: true,
      helpfulCount: 51,
    },
  ],
  "2": [
    {
      id: "vr-2-1",
      author: "@alex_motion",
      rating: R(5),
      body: "도심 야경 타임랩스를 로고 스팅 뒤에 깔았는데 클라이언트 반응이 정말 좋았어요.",
      dateLabel: "2주 전",
      verifiedPurchase: true,
      helpfulCount: 37,
    },
  ],
  "micro-300-night-market": [
    {
      id: "vr-mm-1",
      author: "@sora_kr",
      rating: R(5),
      body: "300원대인데 야시장 무드가 생각보다 고퀄이에요. 쇼츠에 여러 번 재사용 중이에요.",
      dateLabel: "어제",
      verifiedPurchase: true,
      helpfulCount: 22,
    },
  ],
  "dna-100-asphalt": [
    {
      id: "vr-d100-1",
      author: "@leo_visual",
      rating: R(4),
      body: "저렴한데 텍스처 레이어로 충분히 쓸 수 있어요. 오버레이 용도로 잘 활용하고 있습니다.",
      dateLabel: "3주 전",
      verifiedPurchase: true,
      helpfulCount: 14,
    },
  ],
  "fail-3": [
    {
      id: "vr-f3-1",
      author: "@brand_slice",
      rating: R(5),
      body: "실패 클립인데 오히려 숏폼에서 반응이 좋았어요. 밈용으로 잘 씁니다.",
      dateLabel: "8일 전",
      verifiedPurchase: true,
      helpfulCount: 91,
    },
  ],
};

export function getReviewsForVideo(videoId: string): VideoDetailReview[] {
  return VIDEO_DETAIL_REVIEWS[videoId] ?? [];
}

export function getAverageRatingForVideo(videoId: string): number | null {
  const list = getReviewsForVideo(videoId);
  if (list.length === 0) return null;
  const sum = list.reduce((a, r) => a + r.rating, 0);
  return Math.round((sum / list.length) * 10) / 10;
}

export function getReviewCountForVideo(videoId: string): number {
  return getReviewsForVideo(videoId).length;
}

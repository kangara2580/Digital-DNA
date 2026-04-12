/**
 * 조각(동영상) 상세 — 글로벌 이커머스에 가까운 리뷰·구매평(데모 데이터).
 * 실제 서비스에서는 API/DB로 대체합니다.
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
      author: "Mina · Seoul",
      rating: R(5),
      title: "Perfect for travel intros",
      body: "Used this coastal walk clip as a B-roll hook — viewers asked where it was filmed. Great value for a short punch-in.",
      dateLabel: "2 weeks ago",
      verifiedPurchase: true,
      helpfulCount: 128,
    },
    {
      id: "vr-1-2",
      author: "@clip_editor_mina",
      rating: R(5),
      body: "브이로그 인트로에 붙였는데 분위기가 바로 살아요. 짧은 조각인데 편집 시간은 확 줄었습니다.",
      dateLabel: "3 weeks ago",
      verifiedPurchase: true,
      helpfulCount: 64,
    },
  ],
  "3": [
    {
      id: "vr-3-1",
      author: "James · US",
      rating: R(4.5),
      title: "Cafe vibe on point",
      body: "Bought the cafe clip for a product teaser — warm indoor light matches our brand colors. Would buy again.",
      dateLabel: "5 days ago",
      verifiedPurchase: true,
      helpfulCount: 42,
    },
    {
      id: "vr-3-2",
      author: "@shorts_lab",
      rating: R(5),
      body: "비 오는 창가 무드가 숏폼이랑 딱 맞았어요. 재편집 시간이 확 줄었습니다.",
      dateLabel: "1 month ago",
      verifiedPurchase: true,
      helpfulCount: 89,
    },
  ],
  "5": [
    {
      id: "vr-5-1",
      author: "Yuki · JP",
      rating: R(5),
      body: "Rainy window ASMR — used behind a voiceover. Retention on the first 5s improved in our A/B test.",
      dateLabel: "1 week ago",
      verifiedPurchase: true,
      helpfulCount: 56,
    },
    {
      id: "vr-5-2",
      author: "@daily_fail_log",
      rating: R(4),
      title: "Good for mood cuts",
      body: "짧게 넣기 좋아요. 무거운 스톡보다 반응이 좋았어요.",
      dateLabel: "12 days ago",
      verifiedPurchase: true,
      helpfulCount: 31,
    },
  ],
  "7": [
    {
      id: "vr-7-1",
      author: "@live_mood",
      rating: R(5),
      body: "야시장 불빛 클립 — 라이브 인트로에 깔았더니 ‘어디냐’는 댓글이 달렸어요.",
      dateLabel: "4 days ago",
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
      dateLabel: "6 days ago",
      verifiedPurchase: true,
      helpfulCount: 51,
    },
  ],
  "2": [
    {
      id: "vr-2-1",
      author: "Alex · UK",
      rating: R(5),
      title: "Neon city b-roll",
      body: "Night city timelapse — dropped behind a logo sting. Clients loved the energy.",
      dateLabel: "2 weeks ago",
      verifiedPurchase: true,
      helpfulCount: 37,
    },
  ],
  "micro-300-night-market": [
    {
      id: "vr-mm-1",
      author: "Sora · KR",
      rating: R(5),
      body: "300원대인데 야시장 무드가 생각보다 고퀄이에요. 쇼츠에 여러 번 재사용 중이에요.",
      dateLabel: "Yesterday",
      verifiedPurchase: true,
      helpfulCount: 22,
    },
  ],
  "dna-100-asphalt": [
    {
      id: "vr-d100-1",
      author: "Leo · BR",
      rating: R(4),
      body: "Cheap clip but works as a texture layer. Good for overlays.",
      dateLabel: "3 weeks ago",
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
      dateLabel: "8 days ago",
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

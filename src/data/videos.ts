/** 다양한 출처·장소의 샘플 영상(데모용). 실제 서비스에서는 업로드·CDN URL로 교체 */
export type FeedVideo = {
  id: string;
  title: string;
  creator: string;
  src: string;
  poster: string;
  /** 세로(릴스) / 가로(와이드) 피드 구분 */
  orientation: "portrait" | "landscape";
  /** 원 단위 가격(데모). 없으면 표시 안 함 */
  priceWon?: number;
  /** 초 단위 길이 — 썸네일 위에만 재생 시간(예: 0:15)으로 표시 */
  durationSec?: number;
  /** 호버 인스턴트 프리뷰 전용 URL(없으면 src로 앞 구간만 재생) */
  previewSrc?: string;
  /** 호버 프리뷰 구간 길이(초). 기본 3 */
  previewDurationSec?: number;
  /**
   * AI 생성 영상 여부(API·업로드의 `is_ai_generated`와 동일).
   * `true`가 아니면 직접 촬영(Real)로 간주합니다.
   */
  isAiGenerated?: boolean;
};

export const SAMPLE_VIDEOS: FeedVideo[] = [
  {
    id: "1",
    title: "제주 해안 산책로에서",
    creator: "@minji_travel",
    src: "https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 1200,
    durationSec: 18,
  },
  {
    id: "2",
    title: "도심 야경 타임랩스",
    creator: "@urban_lens",
    src: "https://videos.pexels.com/video-files/3045163/3045163-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/1519088/pexels-photo-1519088.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "landscape",
    priceWon: 4500,
    durationSec: 42,
  },
  {
    id: "3",
    title: "카페에서의 하루",
    creator: "@coffee_daily",
    src: "https://videos.pexels.com/video-files/3045160/3045160-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 700,
    durationSec: 12,
  },
  {
    id: "4",
    title: "숲속 트레킹 기록",
    creator: "@trail_k",
    src: "https://videos.pexels.com/video-files/1448735/1448735-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "landscape",
    priceWon: 2200,
    durationSec: 35,
  },
  {
    id: "5",
    title: "비 오는 날 창가",
    creator: "@rainy_mood",
    src: "https://videos.pexels.com/video-files/2491284/2491284-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/1520760/pexels-photo-1520760.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 900,
    durationSec: 24,
  },
  {
    id: "6",
    title: "해변 일몰",
    creator: "@sunset_clips",
    src: "https://videos.pexels.com/video-files/1409899/1409899-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/1683492/pexels-photo-1683492.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "landscape",
    priceWon: 3500,
    durationSec: 51,
  },
  {
    id: "7",
    title: "야시장 풍경",
    creator: "@night_market",
    src: "https://videos.pexels.com/video-files/2495382/2495382-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/931007/pexels-photo-931007.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 1500,
    durationSec: 15,
  },
  {
    id: "8",
    title: "스튜디오 댄스 연습",
    creator: "@studio_d",
    src: "https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/3757376/pexels-photo-3757376.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "landscape",
    priceWon: 1800,
    durationSec: 28,
  },
  {
    id: "9",
    title: "강변 조깅 캠",
    creator: "@river_run",
    src: "https://videos.pexels.com/video-files/3044475/3044475-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/1571458/pexels-photo-1571458.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 500,
    durationSec: 9,
  },
  {
    id: "10",
    title: "설원 하이킹",
    creator: "@snow_peak",
    src: "https://videos.pexels.com/video-files/2889030/2889030-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/869258/pexels-photo-869258.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "landscape",
    priceWon: 3200,
    durationSec: 38,
  },
  {
    id: "11",
    title: "옥상 파티",
    creator: "@rooftop_v",
    src: "https://videos.pexels.com/video-files/3044473/3044473-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 800,
    durationSec: 14,
  },
  {
    id: "12",
    title: "시골 마을 아침",
    creator: "@village_am",
    src: "https://videos.pexels.com/video-files/2570934/2570934-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/235648/pexels-photo-235648.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "landscape",
    priceWon: 2800,
    durationSec: 46,
  },
  /** 홈 「추천 영상」 그리드 — 2행(최대 6열)까지 채우기 위한 추가 세로 클립 */
  {
    id: "13",
    title: "새벽 러닝 트랙",
    creator: "@dawn_runner",
    src: "https://videos.pexels.com/video-files/3044475/3044475-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/1571458/pexels-photo-1571458.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 1100,
    durationSec: 22,
  },
  {
    id: "14",
    title: "네온 골목 산책",
    creator: "@neon_walk",
    src: "https://videos.pexels.com/video-files/3045163/3045163-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/1519088/pexels-photo-1519088.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 2600,
    durationSec: 31,
    isAiGenerated: true,
  },
  {
    id: "15",
    title: "파티 라이트 아래",
    creator: "@party_glow",
    src: "https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/3757376/pexels-photo-3757376.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 1900,
    durationSec: 19,
    isAiGenerated: true,
  },
  {
    id: "16",
    title: "눈 덮인 산 능선",
    creator: "@peak_white",
    src: "https://videos.pexels.com/video-files/2889030/2889030-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/869258/pexels-photo-869258.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 3400,
    durationSec: 40,
    isAiGenerated: true,
  },
  {
    id: "17",
    title: "해변 파도 소리",
    creator: "@wave_listen",
    src: "https://videos.pexels.com/video-files/1409899/1409899-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/1683492/pexels-photo-1683492.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 1500,
    durationSec: 27,
    isAiGenerated: true,
  },
  {
    id: "18",
    title: "마을 골목 골든아워",
    creator: "@golden_alley",
    src: "https://videos.pexels.com/video-files/2570934/2570934-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/235648/pexels-photo-235648.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 2100,
    durationSec: 33,
  },
  /** 100·300·500원대 — DNA 조합기·연관 무드 데모용 마이크로 조각 */
  {
    id: "dna-100-asphalt",
    title: "젖은 아스팔트 조각",
    creator: "@vibe_micro",
    src: "https://videos.pexels.com/video-files/3045163/3045163-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/1519088/pexels-photo-1519088.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 100,
    durationSec: 8,
  },
  {
    id: "dna-300-rain-asmr",
    title: "빗소리 ASMR 조각",
    creator: "@vibe_micro",
    src: "https://videos.pexels.com/video-files/2491284/2491284-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/1520760/pexels-photo-1520760.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 300,
    durationSec: 10,
  },
  {
    id: "dna-500-window-rain",
    title: "창가 빗방울 (숏)",
    creator: "@vibe_micro",
    src: "https://videos.pexels.com/video-files/3045160/3045160-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 500,
    durationSec: 9,
  },
  /** Micro DNA — 300원 이하 전용 그리드용 추가 조각 */
  {
    id: "micro-100-neon-bokeh",
    title: "네온 보케 스킵",
    creator: "@vibe_micro",
    src: "https://videos.pexels.com/video-files/3045163/3045163-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/1519088/pexels-photo-1519088.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 100,
    durationSec: 6,
  },
  {
    id: "micro-150-river-glint",
    title: "강빛 반짝임",
    creator: "@vibe_micro",
    src: "https://videos.pexels.com/video-files/3044475/3044475-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/1571458/pexels-photo-1571458.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 150,
    durationSec: 7,
  },
  {
    id: "micro-200-forest-mist",
    title: "숲 안개 한 줄",
    creator: "@vibe_micro",
    src: "https://videos.pexels.com/video-files/1448735/1448735-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 200,
    durationSec: 8,
  },
  {
    id: "micro-200-beach-foam",
    title: "거품 한 박자",
    creator: "@vibe_micro",
    src: "https://videos.pexels.com/video-files/1409899/1409899-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/1683492/pexels-photo-1683492.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 200,
    durationSec: 7,
  },
  {
    id: "micro-250-rooftop-breeze",
    title: "옥상 바람 컷",
    creator: "@vibe_micro",
    src: "https://videos.pexels.com/video-files/3044473/3044473-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 250,
    durationSec: 8,
  },
  {
    id: "micro-300-night-market",
    title: "야시장 불빛 클립",
    creator: "@vibe_micro",
    src: "https://videos.pexels.com/video-files/2495382/2495382-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/931007/pexels-photo-931007.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 300,
    durationSec: 9,
  },
  {
    id: "micro-300-dance-kick",
    title: "댄스 킥 프레임",
    creator: "@vibe_micro",
    src: "https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/3757376/pexels-photo-3757376.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 300,
    durationSec: 8,
  },
  {
    id: "micro-100-snow-quiet",
    title: "설원 정적 3초",
    creator: "@vibe_micro",
    src: "https://videos.pexels.com/video-files/2889030/2889030-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/869258/pexels-photo-869258.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 100,
    durationSec: 5,
  },
  {
    id: "micro-250-village-dawn",
    title: "마을 새벽 공기",
    creator: "@vibe_micro",
    src: "https://videos.pexels.com/video-files/2570934/2570934-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/235648/pexels-photo-235648.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 250,
    durationSec: 9,
  },
];

/** 인기순위 상단 5슬롯 — 기존과 동일 순서 */
const TRENDING_RANK_TOP_FIVE: FeedVideo[] = [
  SAMPLE_VIDEOS[0],
  SAMPLE_VIDEOS[2],
  SAMPLE_VIDEOS[4],
  SAMPLE_VIDEOS[6],
  SAMPLE_VIDEOS[8],
];

const TRENDING_PORTRAIT_POOL = SAMPLE_VIDEOS.filter(
  (v) => v.orientation === "portrait",
);

/** 실시간 인기순위 데모 — Top 10 (상위 5 고정 시드 + 5)(실서비스는 랭킹 API로 교체) */
export const TRENDING_RANK_CLIPS: FeedVideo[] = (() => {
  const out: FeedVideo[] = [...TRENDING_RANK_TOP_FIVE];
  for (let i = 0; i < 5; i++) {
    out.push(TRENDING_PORTRAIT_POOL[i % TRENDING_PORTRAIT_POOL.length]);
  }
  return out;
})();

/** #실패와실수 카테고리 데모 클립(제목·해시태그만 테마에 맞춤, 미디어는 샘플 재사용) */
export const FAILURE_OOPS_CLIPS: FeedVideo[] = [
  {
    id: "fail-1",
    title: "요리하다 냄비가 탄 순간",
    creator: "@kitchen_oops",
    src: "https://videos.pexels.com/video-files/2491284/2491284-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/1520760/pexels-photo-1520760.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    durationSec: 16,
    priceWon: 950,
  },
  {
    id: "fail-2",
    title: "계단에서 발이 꼬여 넘어짐",
    creator: "@stumble_cam",
    src: "https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/3757376/pexels-photo-3757376.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    durationSec: 11,
    priceWon: 720,
  },
  {
    id: "fail-3",
    title: "커피를 옷에 쏟아버린 날",
    creator: "@spill_daily",
    src: "https://videos.pexels.com/video-files/3045160/3045160-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    durationSec: 20,
    priceWon: 1100,
  },
  {
    id: "fail-4",
    title: "조깅 중 미끄러진 클립",
    creator: "@slip_record",
    src: "https://videos.pexels.com/video-files/3044475/3044475-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/1571458/pexels-photo-1571458.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    durationSec: 13,
    priceWon: 680,
  },
  {
    id: "fail-5",
    title: "쟁반째로 음료를 떨어뜨림",
    creator: "@cafe_fail",
    src: "https://videos.pexels.com/video-files/2495382/2495382-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/931007/pexels-photo-931007.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    durationSec: 17,
    priceWon: 880,
  },
  {
    id: "fail-6",
    title: "파티에서 발 디뎌 넘어짐",
    creator: "@party_oops",
    src: "https://videos.pexels.com/video-files/3044473/3044473-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    durationSec: 14,
    priceWon: 790,
  },
  {
    id: "fail-7",
    title: "해변에서 런닝하다 모래에 꽂힘",
    creator: "@sand_face",
    src: "https://videos.pexels.com/video-files/1409899/1409899-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/1683492/pexels-photo-1683492.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    durationSec: 18,
    priceWon: 640,
  },
  {
    id: "fail-8",
    title: "셀카 찍다가 파도에 휩쓸린 순간",
    creator: "@wave_oops",
    src: "https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    durationSec: 12,
    priceWon: 820,
  },
];

export function shuffleVideos(list: FeedVideo[]): FeedVideo[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


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
  },
];

/** 실시간 인기순위 데모 — 세로 클립 6개 고정 순서(실제 서비스에서는 랭킹 API로 교체) */
export const TRENDING_RANK_CLIPS: FeedVideo[] = [
  SAMPLE_VIDEOS[0],
  SAMPLE_VIDEOS[2],
  SAMPLE_VIDEOS[4],
  SAMPLE_VIDEOS[6],
  SAMPLE_VIDEOS[8],
  SAMPLE_VIDEOS[10],
];

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
  },
  {
    id: "fail-2",
    title: "계단에서 발이 꼬여 넘어짐",
    creator: "@stumble_cam",
    src: "https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/3757376/pexels-photo-3757376.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
  },
  {
    id: "fail-3",
    title: "커피를 옷에 쏟아버린 날",
    creator: "@spill_daily",
    src: "https://videos.pexels.com/video-files/3045160/3045160-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
  },
  {
    id: "fail-4",
    title: "조깅 중 미끄러진 클립",
    creator: "@slip_record",
    src: "https://videos.pexels.com/video-files/3044475/3044475-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/1571458/pexels-photo-1571458.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
  },
  {
    id: "fail-5",
    title: "쟁반째로 음료를 떨어뜨림",
    creator: "@cafe_fail",
    src: "https://videos.pexels.com/video-files/2495382/2495382-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/931007/pexels-photo-931007.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
  },
  {
    id: "fail-6",
    title: "파티에서 발 디뎌 넘어짐",
    creator: "@party_oops",
    src: "https://videos.pexels.com/video-files/3044473/3044473-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
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

/** 5,000원 이하 데모 클립(가성비 모음전) */
export function clipsUnder5000Won(list: FeedVideo[]): FeedVideo[] {
  return list
    .filter((v) => (v.priceWon ?? Infinity) <= 5000)
    .sort((a, b) => (a.priceWon ?? 0) - (b.priceWon ?? 0));
}

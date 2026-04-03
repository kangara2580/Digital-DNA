/** 다양한 출처·장소의 샘플 영상(데모용). 실제 서비스에서는 업로드·CDN URL로 교체 */
export type FeedVideo = {
  id: string;
  title: string;
  creator: string;
  src: string;
  poster: string;
  /** 세로(릴스) / 가로(와이드) 피드 구분 */
  orientation: "portrait" | "landscape";
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
  },
  {
    id: "2",
    title: "도심 야경 타임랩스",
    creator: "@urban_lens",
    src: "https://videos.pexels.com/video-files/3045163/3045163-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/1519088/pexels-photo-1519088.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "landscape",
  },
  {
    id: "3",
    title: "카페에서의 하루",
    creator: "@coffee_daily",
    src: "https://videos.pexels.com/video-files/3045160/3045160-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
  },
  {
    id: "4",
    title: "숲속 트레킹 기록",
    creator: "@trail_k",
    src: "https://videos.pexels.com/video-files/1448735/1448735-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "landscape",
  },
  {
    id: "5",
    title: "비 오는 날 창가",
    creator: "@rainy_mood",
    src: "https://videos.pexels.com/video-files/2491284/2491284-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/1520760/pexels-photo-1520760.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
  },
  {
    id: "6",
    title: "해변 일몰",
    creator: "@sunset_clips",
    src: "https://videos.pexels.com/video-files/1409899/1409899-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/1683492/pexels-photo-1683492.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "landscape",
  },
  {
    id: "7",
    title: "야시장 풍경",
    creator: "@night_market",
    src: "https://videos.pexels.com/video-files/2495382/2495382-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/931007/pexels-photo-931007.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
  },
  {
    id: "8",
    title: "스튜디오 댄스 연습",
    creator: "@studio_d",
    src: "https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/3757376/pexels-photo-3757376.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "landscape",
  },
  {
    id: "9",
    title: "강변 조깅 캠",
    creator: "@river_run",
    src: "https://videos.pexels.com/video-files/3044475/3044475-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/1571458/pexels-photo-1571458.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
  },
  {
    id: "10",
    title: "설원 하이킹",
    creator: "@snow_peak",
    src: "https://videos.pexels.com/video-files/2889030/2889030-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/869258/pexels-photo-869258.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "landscape",
  },
  {
    id: "11",
    title: "옥상 파티",
    creator: "@rooftop_v",
    src: "https://videos.pexels.com/video-files/3044473/3044473-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
  },
  {
    id: "12",
    title: "시골 마을 아침",
    creator: "@village_am",
    src: "https://videos.pexels.com/video-files/2570934/2570934-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/235648/pexels-photo-235648.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "landscape",
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

import type { FeedVideo } from "@/data/videos";

const PEXELS_VIDEO_RE = /^https?:\/\/videos\.pexels\.com\//i;

function localFallbackVideoSrc(seed: string): string {
  const hash = Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const idx = (Math.abs(hash) % 10) + 1;
  return `/videos/sample${idx}.mp4`;
}

/** 홈 「실시간 인기순위」 데모용 샘플 클립 Top 10 (`TrendingRankSection`) */
export const TIKTOK_MOCK_DANCE_CLIPS: FeedVideo[] = [
  {
    id: "mock-dance-1",
    title: "[DEMO] K-pop 훅 안무 챌린지",
    creator: "@dance_luna",
    src: "https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/3757376/pexels-photo-3757376.jpeg?auto=compress&cs=tinysrgb&w=960",
    previewSrc:
      "https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4",
    orientation: "portrait",
    durationSec: 16,
    priceWon: 900,
  },
  {
    id: "mock-dance-2",
    title: "[DEMO] 스트릿 댄스 풋워크",
    creator: "@move_mika",
    src: "https://videos.pexels.com/video-files/3044473/3044473-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=960",
    previewSrc:
      "https://videos.pexels.com/video-files/3044473/3044473-hd_1920_1080_25fps.mp4",
    orientation: "portrait",
    durationSec: 14,
    priceWon: 1200,
  },
  {
    id: "mock-dance-3",
    title: "[DEMO] 파티 플로어 프리스타일",
    creator: "@beat_yuna",
    src: "https://videos.pexels.com/video-files/2495382/2495382-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/931007/pexels-photo-931007.jpeg?auto=compress&cs=tinysrgb&w=960",
    previewSrc:
      "https://videos.pexels.com/video-files/2495382/2495382-hd_1920_1080_30fps.mp4",
    orientation: "portrait",
    durationSec: 18,
    priceWon: 1500,
  },
  {
    id: "mock-dance-4",
    title: "[DEMO] 거울 앞 15초 안무",
    creator: "@mirror_chae",
    src: "https://videos.pexels.com/video-files/3045160/3045160-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=960",
    previewSrc:
      "https://videos.pexels.com/video-files/3045160/3045160-hd_1920_1080_25fps.mp4",
    orientation: "portrait",
    durationSec: 15,
    priceWon: 1000,
  },
  {
    id: "mock-dance-5",
    title: "[DEMO] 네온 무드 웨이브",
    creator: "@neon_j",
    src: "https://videos.pexels.com/video-files/3045163/3045163-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/1519088/pexels-photo-1519088.jpeg?auto=compress&cs=tinysrgb&w=960",
    previewSrc:
      "https://videos.pexels.com/video-files/3045163/3045163-hd_1920_1080_25fps.mp4",
    orientation: "portrait",
    durationSec: 17,
    priceWon: 1300,
  },
  {
    id: "mock-dance-6",
    title: "듀엣 챌린지 컷",
    creator: "@duet_ryu",
    src: "https://videos.pexels.com/video-files/3044475/3044475-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/1571458/pexels-photo-1571458.jpeg?auto=compress&cs=tinysrgb&w=960",
    previewSrc:
      "https://videos.pexels.com/video-files/3044475/3044475-hd_1920_1080_25fps.mp4",
    orientation: "portrait",
    durationSec: 13,
    priceWon: 800,
  },
  {
    id: "mock-dance-7",
    title: "강약 포인트 댄스",
    creator: "@point_sori",
    src: "https://videos.pexels.com/video-files/2491284/2491284-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/1520760/pexels-photo-1520760.jpeg?auto=compress&cs=tinysrgb&w=960",
    previewSrc:
      "https://videos.pexels.com/video-files/2491284/2491284-hd_1920_1080_30fps.mp4",
    orientation: "portrait",
    durationSec: 12,
    priceWon: 700,
  },
  {
    id: "mock-dance-8",
    title: "밤거리 힙합 루틴",
    creator: "@urban_hana",
    src: "https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=960",
    previewSrc:
      "https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_30fps.mp4",
    orientation: "portrait",
    durationSec: 19,
    priceWon: 1600,
  },
  {
    id: "mock-dance-9",
    title: "팔로우 미 챌린지",
    creator: "@follow_mo",
    src: "https://videos.pexels.com/video-files/1409899/1409899-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/1683492/pexels-photo-1683492.jpeg?auto=compress&cs=tinysrgb&w=960",
    previewSrc:
      "https://videos.pexels.com/video-files/1409899/1409899-hd_1920_1080_25fps.mp4",
    orientation: "portrait",
    durationSec: 15,
    priceWon: 1100,
  },
  {
    id: "mock-dance-10",
    title: "엔딩 포즈 릴레이",
    creator: "@pose_relay",
    src: "https://videos.pexels.com/video-files/2570934/2570934-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/235648/pexels-photo-235648.jpeg?auto=compress&cs=tinysrgb&w=960",
    previewSrc:
      "https://videos.pexels.com/video-files/2570934/2570934-hd_1920_1080_30fps.mp4",
    orientation: "portrait",
    durationSec: 20,
    priceWon: 1400,
  },
];

// 데모 Top10도 Pexels 403을 피하도록 로컬 샘플 MP4로 치환.
TIKTOK_MOCK_DANCE_CLIPS.forEach((clip, i) => {
  if (!PEXELS_VIDEO_RE.test(clip.src)) return;
  const fallback = localFallbackVideoSrc(`${clip.id}-${i}`);
  clip.src = fallback;
  if (clip.previewSrc && PEXELS_VIDEO_RE.test(clip.previewSrc)) {
    clip.previewSrc = fallback;
  }
});

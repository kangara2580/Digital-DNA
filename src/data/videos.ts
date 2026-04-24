import { MOCK_VIDEOS } from "@/constants/videos";

/** ??????? ?(???. ? ??? ??DN URL? */
export type FeedVideo = {
  id: string;
  title: string;
  creator: string;
  src: string;
  poster: string;
  /** ?() / ???) ?  */
  orientation: "portrait" | "landscape";
  /** ??? ??). ??? ????*/
  priceWon?: number;
  /** ??  ???????? ?(?? 0:15)? ? */
  durationSec?: number;
  /** ? ?? ??? URL(??src?????) */
  previewSrc?: string;
  /** ? ?? (?.  3 */
  previewDurationSec?: number;
  /**
   * AI ? ? ??(API?? `is_ai_generated`? ?).
   * `true` ?? (Real)????
   */
  isAiGenerated?: boolean;
  /**
   * TikTok Research API ????MP4 ? ? video id????????????   * (?? `https://www.tiktok.com/embed/v2/{id}`)
   */
  tiktokEmbedId?: string;
};

const PEXELS_VIDEO_RE = /^https?:\/\/videos\.pexels\.com\//i;

function localFallbackVideoSrc(seed: string): string {
  const hash = Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const idx = (Math.abs(hash) % 10) + 1;
  return `/videos/sample${idx}.mp4`;
}

function normalizeBlockedVideoSources(list: FeedVideo[]) {
  list.forEach((v, i) => {
    if (!PEXELS_VIDEO_RE.test(v.src)) return;
    const fallback = localFallbackVideoSrc(`${v.id}-${i}`);
    v.src = fallback;
    if (v.previewSrc && PEXELS_VIDEO_RE.test(v.previewSrc)) {
      v.previewSrc = fallback;
    }
    // ??Pexels ??  ? ????  ? ?????    // ???? ?????? ???Start Frame)????????
    v.poster = "";
  });
}

export const SAMPLE_VIDEOS: FeedVideo[] = [
  {
    id: "1",
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
    creator: "@village_am",
    src: "https://videos.pexels.com/video-files/2570934/2570934-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/235648/pexels-photo-235648.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "landscape",
    priceWon: 2800,
    durationSec: 46,
  },
  /** ???????????2??? 6??? ?? ? ? ? */
  {
    id: "13",
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
    creator: "@golden_alley",
    src: "https://videos.pexels.com/video-files/2570934/2570934-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/235648/pexels-photo-235648.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 2100,
    durationSec: 33,
  },
  /** 100300500?? ??DNA   ????  */
  {
    id: "dna-100-asphalt",
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
    creator: "@vibe_micro",
    src: "https://videos.pexels.com/video-files/3045160/3045160-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 500,
    durationSec: 9,
  },
  /** Micro DNA ??300??? ? ? ?  */
  {
    id: "micro-100-neon-bokeh",
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
    creator: "@vibe_micro",
    src: "https://videos.pexels.com/video-files/2570934/2570934-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/235648/pexels-photo-235648.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    priceWon: 250,
    durationSec: 9,
  },
];

/**
 * ??( `public/videos`) ??? ??**?? `SAMPLE_VIDEOS`? ?? ?? ?**
 * (: ? ???Pexels ??  MP4? ?????? ?? ??? ?? ?)
 *
 * 1) `MOCK_VIDEOS[].thumbnail_url`???????(???? URL  ??
 * 2)  ??`sample3.mp4` ??`sample3.jpg` **? ? ? JPG**?? (`public/videos/sample3.jpg`)
 * 3) JPG????`poster`???????`<video>`?????? ?(?????)
 */
function posterForLocalTrendingClip(
  videoUrl: string,
  explicitThumbnail: string,
): string {
  const ex = explicitThumbnail.trim();
  if (ex && /^https?:\/\//i.test(ex)) return ex;
  if (!videoUrl.startsWith("/videos/") || !/\.mp4$/i.test(videoUrl)) return "";
  //  JPG ??? ? ??404 ????? ????
  return "";
}

/** `public/videos`  ? ???? Top 10 (`@/constants/videos` MOCK_VIDEOS? 1:1) */
export const LOCAL_TRENDING_FEED_VIDEOS: FeedVideo[] = MOCK_VIDEOS.map(
  (m, i) => ({
    id: m.id,
    title: m.title,
    creator: "@reels_local",
    src: m.video_url,
    poster: posterForLocalTrendingClip(m.video_url, m.thumbnail_url),
    orientation: "portrait",
    priceWon: 900 + (i % 5) * 300,
    previewSrc: m.video_url,
    /** SAMPLE_VIDEOS? ? ??? ???  */
    durationSec: 10 + (i % 20),
  }),
);

/** ???? ? ?? ? 10?*/
export const TRENDING_RANK_CLIPS: FeedVideo[] = [...LOCAL_TRENDING_FEED_VIDEOS];

/** #???  ? ?(???????, ? ? ??? */
export const FAILURE_OOPS_CLIPS: FeedVideo[] = [
  {
    id: "fail-1",
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
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
    title: "Untitled",
    creator: "@wave_oops",
    src: "https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=640",
    orientation: "portrait",
    durationSec: 12,
    priceWon: 820,
  },
];

// /? ?? Pexels ??403?????  ? MP4?.
normalizeBlockedVideoSources(SAMPLE_VIDEOS);
normalizeBlockedVideoSources(FAILURE_OOPS_CLIPS);

/**
 * ? ??????? ?????(Fisher?ates + ? PRNG).
 * `Math.random()` ?? SSR/??????? ? ??????? ?.
 */
export function shuffleVideos(list: FeedVideo[]): FeedVideo[] {
  const a = [...list];
  if (a.length <= 1) return a;

  const seedStr = [...a]
    .map((v) => v.id)
    .sort()
    .join("\0");
  let state = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    state = Math.imul(state ^ seedStr.charCodeAt(i), 16777619);
  }
  /** mulberry32 ????? ?  */
  let s = state >>> 0;
  const next = () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


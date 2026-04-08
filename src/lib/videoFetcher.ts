/**
 * 통합 영상 검색 유틸 (Pexels + Pixabay)
 *
 * 목표:
 * 1) 한 곳에서 검색 실패하면 다른 곳에서 자동 fallback
 * 2) 메인 화면 배경용으로 "바로 재생 가능한 고화질 mp4 URL" 반환
 * 3) 추후 공급자(provider) 추가가 쉬운 구조
 */

export type VideoSearchItem = {
  id: string;
  videoUrl: string;
  width: number;
  height: number;
  source: "pexels" | "pixabay" | "wikimedia";
};

function isVideoSearchItem(x: VideoSearchItem | null): x is VideoSearchItem {
  return x !== null;
}

export type ImageSearchItem = {
  id: string;
  imageUrl: string;
  width: number;
  height: number;
  source: "pexels" | "pixabay";
};

function isImageSearchItem(x: ImageSearchItem | null): x is ImageSearchItem {
  return x !== null;
}

export type BackgroundSearchMode = "video" | "image";

type PexelsVideoFile = {
  width: number;
  height: number;
  link: string;
};

type PexelsVideo = {
  id: number;
  video_files: PexelsVideoFile[];
};

type PexelsSearchResponse = {
  videos: PexelsVideo[];
};

type PexelsPhoto = {
  id: number;
  width: number;
  height: number;
  src: {
    original?: string;
    large2x?: string;
    large?: string;
  };
};

type PexelsPhotoSearchResponse = {
  photos: PexelsPhoto[];
};

type PixabayVideoVariant = {
  url: string;
  width: number;
  height: number;
};

type PixabayHit = {
  id: number;
  videos?: {
    tiny?: PixabayVideoVariant;
    small?: PixabayVideoVariant;
    medium?: PixabayVideoVariant;
    large?: PixabayVideoVariant;
  };
};

type PixabaySearchResponse = {
  hits?: PixabayHit[];
};

type PixabayImageHit = {
  id: number;
  imageURL?: string;
  largeImageURL?: string;
  webformatURL?: string;
  imageWidth?: number;
  imageHeight?: number;
};

type PixabayImageSearchResponse = {
  hits?: PixabayImageHit[];
};

type WikimediaQueryPage = {
  pageid: number;
  title?: string;
  videoinfo?: Array<{
    url?: string;
    width?: number;
    height?: number;
    mime?: string;
  }>;
};

type WikimediaVideoSearchResponse = {
  query?: {
    pages?: Record<string, WikimediaQueryPage>;
  };
};

const PEXELS_API_BASE = "https://api.pexels.com/videos/search";
const PEXELS_PHOTO_API_BASE = "https://api.pexels.com/v1/search";
const PIXABAY_API_BASE = "https://pixabay.com/api/videos/";
const PIXABAY_IMAGE_API_BASE = "https://pixabay.com/api/";
const WIKIMEDIA_API_BASE = "https://commons.wikimedia.org/w/api.php";

/**
 * 한국어 키워드를 영상 API에서 잘 먹는 영어 검색어로 보정합니다.
 * (초기 버전: 자주 쓰는 테마 중심 사전 매핑)
 */
const KO_TO_EN_KEYWORD_MAP: Array<[RegExp, string]> = [
  [/골목|거리|뒷골목/, "alley street lane"],
  [/우주|은하|별|행성/, "space galaxy stars"],
  [/바다|해변|파도|오션/, "ocean sea waves"],
  [/숲|산림|나무|정글/, "forest trees nature"],
  [/도시|시티|빌딩|도심/, "city downtown skyline"],
  [/비|빗길|우천/, "rain wet street"],
  [/노을|석양|해질녘/, "sunset golden hour"],
  [/눈|설경|겨울/, "snow winter"],
  [/네온|사이버|사이버펑크/, "neon cyberpunk lights"],
];

type ExpansionRule = { pattern: RegExp; keywords: string[] };

/**
 * 한국어/영어 입력을 AI 검색 친화 쿼리로 확장하는 사전.
 * 예) "네온사인이 많은 일본 골목" -> tokyo + neon + alley + cinematic 계열 키워드 자동 확장
 */
const KEYWORD_EXPANSION_RULES: ExpansionRule[] = [
  { pattern: /일본|도쿄|신주쿠|오사카|일식|japan|tokyo/i, keywords: ["tokyo", "japan", "japanese street", "shinjuku"] },
  { pattern: /네온|네온사인|사이버|cyber|neon/i, keywords: ["neon lights", "glowing signs", "cyberpunk", "vibrant city lights"] },
  { pattern: /골목|거리|alley|street|lane/i, keywords: ["alleyway", "street view", "urban lane", "city walk"] },
  { pattern: /밤|야경|night|dark/i, keywords: ["night", "night city", "moody lighting"] },
  { pattern: /비|우천|rain|wet/i, keywords: ["rainy", "wet pavement", "reflections"] },
  { pattern: /우주|은하|galaxy|space|cosmic/i, keywords: ["space", "nebula", "stars", "cosmic background"] },
  { pattern: /바다|해변|ocean|sea|beach/i, keywords: ["ocean", "sea waves", "aerial coast"] },
  { pattern: /숲|forest|nature|tree/i, keywords: ["forest", "green nature", "sun rays through trees"] },
  { pattern: /노을|sunset|golden hour/i, keywords: ["sunset", "golden hour", "warm cinematic light"] },
  { pattern: /도시|city|downtown|urban/i, keywords: ["cityscape", "downtown", "urban environment"] },
];

const QUALITY_BOOSTER_TOKENS = [
  "cinematic",
  "4k",
  "ultra detailed",
  "high resolution",
  "photorealistic",
  "professional lighting",
];

const COUNTRY_CITY_VIBE_RULES: ExpansionRule[] = [
  { pattern: /일본|japan|tokyo|도쿄|shibuya|시부야/i, keywords: ["neon", "shibuya crossing", "night city", "tokyo street"] },
  { pattern: /인도네시아|indonesia|bali|발리|jakarta|자카르타/i, keywords: ["tropical", "beach", "sunset", "exotic", "island"] },
  { pattern: /스페인|spain|barcelona|madrid|마드리드|바르셀로나/i, keywords: ["mediterranean", "warm city", "european street", "golden light"] },
  { pattern: /프랑스|france|paris|파리/i, keywords: ["paris street", "romantic city", "elegant architecture"] },
  { pattern: /미국|usa|new york|la|los angeles|뉴욕/i, keywords: ["downtown", "urban skyline", "city lights"] },
];

const STYLE_TAG_RULES: Array<{ pattern: RegExp; weightedTags: Array<[string, number]> }> = [
  {
    pattern: /cyberpunk|사이버펑크|네온/i,
    weightedTags: [
      ["cyberpunk", 3],
      ["neon lights", 2],
      ["futuristic city", 2],
      ["night", 1],
    ],
  },
  {
    pattern: /ghibli|지브리|애니메이션 감성|몽환/i,
    weightedTags: [
      ["dreamy", 3],
      ["soft lighting", 2],
      ["whimsical", 2],
      ["atmospheric", 1],
    ],
  },
  {
    pattern: /cinematic|시네마틱|영화/i,
    weightedTags: [
      ["cinematic", 3],
      ["movie scene", 2],
      ["dramatic light", 2],
      ["high quality", 1],
    ],
  },
];

function normalizeSearchKeyword(input: string): string {
  const raw = input.trim().toLowerCase();
  if (!raw) return "";

  // 영문만 있는 경우는 그대로 사용
  if (/^[a-z0-9 ,._-]+$/.test(raw)) {
    return raw;
  }

  // 한글/혼합 텍스트는 매핑된 핵심 토큰을 조합
  const mappedTokens: string[] = [];
  for (const [pattern, mapped] of KO_TO_EN_KEYWORD_MAP) {
    if (pattern.test(raw)) mappedTokens.push(mapped);
  }
  if (mappedTokens.length > 0) {
    return Array.from(new Set(mappedTokens.join(" ").split(/\s+/).filter(Boolean))).join(" ");
  }

  // 사전에 없으면 안전한 범용 배경 키워드 사용
  return "cinematic background";
}

function detectLanguageHeuristic(input: string): string {
  if (/[가-힣]/.test(input)) return "ko";
  if (/[\u3040-\u30ff]/.test(input)) return "ja";
  if (/[\u4e00-\u9fff]/.test(input)) return "zh";
  if (/[\u0400-\u04FF]/.test(input)) return "ru";
  if (/[áéíóúñü¿¡]/i.test(input)) return "es";
  if (/[\u0600-\u06FF]/.test(input)) return "ar";
  if (/[\u0E00-\u0E7F]/.test(input)) return "th";
  if (/^[\x00-\x7F]+$/.test(input)) return "en";
  return "auto";
}

async function translateToEnglish(input: string): Promise<{ translated: string; detectedLang: string }> {
  const q = input.trim();
  if (!q) return { translated: "", detectedLang: "unknown" };
  const heuristic = detectLanguageHeuristic(q);
  if (heuristic === "en") return { translated: q, detectedLang: "en" };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1800);
    const url = new URL("https://translate.googleapis.com/translate_a/single");
    url.searchParams.set("client", "gtx");
    url.searchParams.set("sl", "auto");
    url.searchParams.set("tl", "en");
    url.searchParams.set("dt", "t");
    url.searchParams.set("q", q);

    const res = await fetch(url.toString(), {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json,text/plain,*/*" },
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`translate_failed:${res.status}`);
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) throw new Error("translate_invalid_response");
    const first = data[0] as unknown[];
    const translated = Array.isArray(first)
      ? first
          .map((chunk) => (Array.isArray(chunk) ? String(chunk[0] ?? "") : ""))
          .join("")
          .trim()
      : q;
    const detectedLang = typeof data[2] === "string" ? data[2] : heuristic;
    return { translated: translated || q, detectedLang: detectedLang || heuristic };
  } catch {
    // 외부 번역 실패 시 원문 + 휴리스틱 언어 결과로 폴백
    return { translated: q, detectedLang: heuristic };
  }
}

function getExpansionTokens(input: string): string[] {
  const raw = input.trim().toLowerCase();
  if (!raw) return [];
  const tokens: string[] = [];
  for (const rule of KEYWORD_EXPANSION_RULES) {
    if (rule.pattern.test(raw)) tokens.push(...rule.keywords);
  }
  return Array.from(new Set(tokens));
}

function getCountryCityVibeTokens(input: string): string[] {
  const raw = input.trim().toLowerCase();
  if (!raw) return [];
  const tokens: string[] = [];
  for (const rule of COUNTRY_CITY_VIBE_RULES) {
    if (rule.pattern.test(raw)) tokens.push(...rule.keywords);
  }
  return Array.from(new Set(tokens));
}

function buildWeightedStyleTags(input: string): string[] {
  const raw = input.trim().toLowerCase();
  if (!raw) return [];
  const weighted: string[] = [];
  for (const rule of STYLE_TAG_RULES) {
    if (!rule.pattern.test(raw)) continue;
    for (const [tag, weight] of rule.weightedTags) {
      for (let i = 0; i < Math.max(1, weight); i += 1) weighted.push(tag);
    }
  }
  return weighted;
}

function buildSearchQueries(input: string, translatedEn: string, mode: BackgroundSearchMode): string[] {
  const raw = input.trim().toLowerCase();
  const normalized = normalizeSearchKeyword(translatedEn || input);
  const expanded = getExpansionTokens(`${input} ${translatedEn}`);
  const vibes = getCountryCityVibeTokens(`${input} ${translatedEn}`);
  const weightedStyles = buildWeightedStyleTags(`${input} ${translatedEn}`);
  const quality = mode === "image" ? QUALITY_BOOSTER_TOKENS : [...QUALITY_BOOSTER_TOKENS, "b-roll"];

  const boosted = Array.from(
    new Set([translatedEn, normalized, ...expanded, ...vibes, ...quality].filter(Boolean)),
  ).join(", ");

  const altBoosted = Array.from(
    new Set([translatedEn, normalized, ...expanded, ...vibes, ...weightedStyles, "wide shot", "background", "cinematic composition", "atmospheric"].filter(Boolean)),
  ).join(", ");

  return Array.from(
    new Set([raw, translatedEn.toLowerCase(), normalized, boosted, altBoosted].filter(Boolean)),
  );
}

function scoreImageForPreview(item: { width: number; height: number }): number {
  const w = Math.max(1, item.width || 1);
  const h = Math.max(1, item.height || 1);
  const pixels = w * h;
  // 현재 미리보기는 가로 배경 비중이 높아 16:9 기준으로 가중
  const targetAspect = 16 / 9;
  const aspect = w / h;
  const aspectPenalty = Math.abs(aspect - targetAspect);
  const aspectScore = Math.max(0, 1 - Math.min(1, aspectPenalty));
  return pixels + aspectScore * 2_000_000;
}

/**
 * 통합 검색 진입점.
 * - 1차: Pexels
 * - 2차: Pixabay
 */
export async function searchVideosWithFallback(
  keyword: string,
  perPage = 8,
  seed = 0,
): Promise<VideoSearchItem[]> {
  console.log("[videoFetcher] input keyword:", keyword);
  const translated = await translateToEnglish(keyword);
  console.log("[videoFetcher] detected language:", translated.detectedLang);
  console.log("[videoFetcher] translated keyword:", translated.translated);
  console.log("[videoFetcher] normalized keyword:", normalizeSearchKeyword(translated.translated));
  console.log("[videoFetcher] seed:", seed);
  const queryCandidates = buildSearchQueries(keyword, translated.translated, "video");

  let lastError: unknown = null;
  for (const query of queryCandidates) {
    console.log("[videoFetcher] trying query:", query);
    const merged: VideoSearchItem[] = [];
    const seen = new Set<string>();
    try {
      const pexels = await searchPexelsVideos(query, perPage);
      for (const item of pexels) {
        if (seen.has(item.videoUrl)) continue;
        seen.add(item.videoUrl);
        merged.push(item);
      }
    } catch (err) {
      lastError = err;
    }

    try {
      const pixabay = await searchPixabayVideos(query, perPage);
      for (const item of pixabay) {
        if (seen.has(item.videoUrl)) continue;
        seen.add(item.videoUrl);
        merged.push(item);
      }
    } catch (err) {
      lastError = err;
    }
    try {
      const wikimedia = await searchWikimediaVideos(query, Math.min(perPage, 30));
      for (const item of wikimedia) {
        if (seen.has(item.videoUrl)) continue;
        seen.add(item.videoUrl);
        merged.push(item);
      }
    } catch (err) {
      lastError = err;
    }
    if (merged.length > 0) return reorderBySeed(merged, seed);
  }

  if (lastError instanceof Error) throw lastError;
  return [];
}

/**
 * 이미지 fallback 검색:
 * 1) Pexels Photos
 * 2) Pixabay Images
 */
export async function searchImagesWithFallback(
  keyword: string,
  perPage = 8,
  seed = 0,
): Promise<ImageSearchItem[]> {
  const translated = await translateToEnglish(keyword);
  const queryCandidates = buildSearchQueries(keyword, translated.translated, "image");

  let lastError: unknown = null;
  for (const query of queryCandidates) {
    const merged: ImageSearchItem[] = [];
    const seen = new Set<string>();
    try {
      const pexels = await searchPexelsImages(query, perPage);
      for (const item of pexels) {
        if (seen.has(item.imageUrl)) continue;
        seen.add(item.imageUrl);
        merged.push(item);
      }
    } catch (err) {
      lastError = err;
    }
    try {
      const pixabay = await searchPixabayImages(query, perPage);
      for (const item of pixabay) {
        if (seen.has(item.imageUrl)) continue;
        seen.add(item.imageUrl);
        merged.push(item);
      }
    } catch (err) {
      lastError = err;
    }
    if (merged.length > 0) return reorderImagesBySeed(merged, seed);
  }

  if (lastError instanceof Error) throw lastError;
  return [];
}

/**
 * 배경 검색 통합 진입점 (video / image 모드 분기).
 */
export async function searchBackgroundWithFallback(
  keyword: string,
  perPage = 8,
  seed = 0,
  mode: BackgroundSearchMode = "video",
) {
  if (mode === "image") {
    return searchImagesWithFallback(keyword, perPage, seed);
  }
  return searchVideosWithFallback(keyword, perPage, seed);
}

function reorderBySeed(items: VideoSearchItem[], seed: number): VideoSearchItem[] {
  if (items.length <= 1) return items;
  const offset = Math.abs(seed) % items.length;
  if (offset === 0) return items;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

/**
 * Pexels 영상 검색.
 * 서버에서만 실행되도록(키 보호) API Route에서 호출하는 것을 권장.
 */
export async function searchPexelsVideos(
  keyword: string,
  perPage = 8,
): Promise<VideoSearchItem[]> {
  const apiKey =
    process.env.PEXELS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_PEXELS_API_KEY?.trim();
  console.log(
    "[videoFetcher][pexels] key status:",
    apiKey ? `loaded(len=${apiKey.length})` : "missing",
  );
  if (!apiKey) {
    throw new Error("PEXELS_API_KEY is missing");
  }

  const q = keyword.trim();
  if (!q) return [];

  const url = new URL(PEXELS_API_BASE);
  url.searchParams.set("query", q);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("size", "large");

  const res = await fetch(url.toString(), {
    headers: { Authorization: apiKey },
    cache: "no-store",
  });
  console.log("[videoFetcher][pexels] status:", res.status, "query:", q);
  if (!res.ok) {
    throw new Error(`pexels_search_failed:${res.status}`);
  }

  const data = (await res.json()) as PexelsSearchResponse;
  const videos = Array.isArray(data.videos) ? data.videos : [];

  return videos
    .map((v): VideoSearchItem | null => {
      const files = Array.isArray(v.video_files) ? v.video_files : [];
      // 가장 큰 해상도 파일 선택 (배경 영상 화질 우선)
      const best = files
        .slice()
        .sort((a, b) => b.width * b.height - a.width * a.height)[0];
      if (!best?.link) return null;
      return {
        id: `pexels-${v.id}`,
        videoUrl: best.link,
        width: best.width,
        height: best.height,
        source: "pexels" as const,
      };
    })
    .filter(isVideoSearchItem);
}

/**
 * Pixabay 영상 검색.
 * - Pixabay는 hit마다 tiny/small/medium/large 변형이 있어서
 *   가능한 한 큰 해상도 변형을 선택합니다.
 */
export async function searchPixabayVideos(
  keyword: string,
  perPage = 8,
): Promise<VideoSearchItem[]> {
  const apiKey =
    process.env.PIXABAY_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_PIXABAY_API_KEY?.trim();
  console.log(
    "[videoFetcher][pixabay] key status:",
    apiKey ? `loaded(len=${apiKey.length})` : "missing",
  );
  if (!apiKey) {
    throw new Error("PIXABAY_API_KEY is missing");
  }

  const q = keyword.trim();
  if (!q) return [];

  const url = new URL(PIXABAY_API_BASE);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", q);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("video_type", "all");
  url.searchParams.set("safesearch", "true");

  const res = await fetch(url.toString(), { cache: "no-store" });
  console.log("[videoFetcher][pixabay] status:", res.status, "query:", q);
  if (!res.ok) {
    throw new Error(`pixabay_search_failed:${res.status}`);
  }

  const data = (await res.json()) as PixabaySearchResponse;
  const hits = Array.isArray(data.hits) ? data.hits : [];

  return hits
    .map((hit): VideoSearchItem | null => {
      const vars = hit.videos;
      if (!vars) return null;
      // large -> medium -> small -> tiny 순으로 선택
      const best =
        vars.large ?? vars.medium ?? vars.small ?? vars.tiny ?? null;
      if (!best?.url) return null;
      return {
        id: `pixabay-${hit.id}`,
        videoUrl: best.url,
        width: best.width,
        height: best.height,
        source: "pixabay" as const,
      };
    })
    .filter(isVideoSearchItem);
}

/**
 * Wikimedia Commons 무료 영상 검색 (API 키 불필요).
 * 오픈 라이선스 소스로, Pexels/Pixabay 결과가 부족할 때 다양성을 보강합니다.
 */
export async function searchWikimediaVideos(
  keyword: string,
  perPage = 20,
): Promise<VideoSearchItem[]> {
  const q = keyword.trim();
  if (!q) return [];

  const url = new URL(WIKIMEDIA_API_BASE);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrsearch", `filetype:video ${q}`);
  url.searchParams.set("gsrlimit", String(Math.max(5, Math.min(30, perPage))));
  url.searchParams.set("prop", "videoinfo");
  url.searchParams.set("viprop", "url|size|mime");
  url.searchParams.set("origin", "*");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`wikimedia_video_search_failed:${res.status}`);
  }

  const data = (await res.json()) as WikimediaVideoSearchResponse;
  const pages = data.query?.pages ? Object.values(data.query.pages) : [];

  return pages
    .map((p): VideoSearchItem | null => {
      const info = Array.isArray(p.videoinfo) ? p.videoinfo[0] : undefined;
      const mediaUrl = info?.url;
      if (!mediaUrl) return null;
      const mime = (info?.mime ?? "").toLowerCase();
      if (mime && !mime.startsWith("video/")) return null;
      return {
        id: `wikimedia-${p.pageid}`,
        videoUrl: mediaUrl,
        width: info?.width ?? 0,
        height: info?.height ?? 0,
        source: "wikimedia",
      };
    })
    .filter(isVideoSearchItem);
}

/**
 * Pexels 이미지 검색.
 */
export async function searchPexelsImages(
  keyword: string,
  perPage = 8,
): Promise<ImageSearchItem[]> {
  const apiKey =
    process.env.PEXELS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_PEXELS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("PEXELS_API_KEY is missing");
  }

  const q = keyword.trim();
  if (!q) return [];

  const url = new URL(PEXELS_PHOTO_API_BASE);
  url.searchParams.set("query", q);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("size", "large");

  const res = await fetch(url.toString(), {
    headers: { Authorization: apiKey },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`pexels_image_search_failed:${res.status}`);
  }

  const data = (await res.json()) as PexelsPhotoSearchResponse;
  const photos = Array.isArray(data.photos) ? data.photos : [];

  return photos
    .map((p): ImageSearchItem | null => {
      const src = p.src?.large2x || p.src?.large || p.src?.original;
      if (!src) return null;
      return {
        id: `pexels-photo-${p.id}`,
        imageUrl: src,
        width: p.width,
        height: p.height,
        source: "pexels",
      };
    })
    .filter(isImageSearchItem)
    .sort((a, b) => scoreImageForPreview(b) - scoreImageForPreview(a));
}

/**
 * Pixabay 이미지 검색.
 */
export async function searchPixabayImages(
  keyword: string,
  perPage = 8,
): Promise<ImageSearchItem[]> {
  const apiKey =
    process.env.PIXABAY_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_PIXABAY_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("PIXABAY_API_KEY is missing");
  }

  const q = keyword.trim();
  if (!q) return [];

  const url = new URL(PIXABAY_IMAGE_API_BASE);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", q);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("safesearch", "true");
  url.searchParams.set("orientation", "horizontal");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`pixabay_image_search_failed:${res.status}`);
  }

  const data = (await res.json()) as PixabayImageSearchResponse;
  const hits = Array.isArray(data.hits) ? data.hits : [];

  return hits
    .map((hit): ImageSearchItem | null => {
      const src = hit.largeImageURL || hit.imageURL || hit.webformatURL;
      if (!src) return null;
      return {
        id: `pixabay-photo-${hit.id}`,
        imageUrl: src,
        width: hit.imageWidth ?? 0,
        height: hit.imageHeight ?? 0,
        source: "pixabay",
      };
    })
    .filter(isImageSearchItem)
    .sort((a, b) => scoreImageForPreview(b) - scoreImageForPreview(a));
}

function reorderImagesBySeed(items: ImageSearchItem[], seed: number): ImageSearchItem[] {
  if (items.length <= 1) return items;
  const offset = Math.abs(seed) % items.length;
  if (offset === 0) return items;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

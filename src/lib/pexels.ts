/**
 * Pexels 영상 검색 유틸.
 * - API 키는 서버(.env.local)에서만 읽습니다.
 * - 클라이언트에서는 이 파일을 직접 호출하지 않고, API Route를 통해 간접 호출합니다.
 */

type PexelsVideoFile = {
  id: number;
  quality: string;
  width: number;
  height: number;
  link: string;
};

type PexelsVideo = {
  id: number;
  width: number;
  height: number;
  duration: number;
  video_files: PexelsVideoFile[];
};

type PexelsSearchResponse = {
  videos: PexelsVideo[];
};

export type PexelsSearchItem = {
  id: number;
  videoUrl: string;
  width: number;
  height: number;
};

const PEXELS_API_BASE = "https://api.pexels.com/videos/search";

/**
 * 영상 키워드(예: "space", "ocean")로 고화질 영상을 검색합니다.
 */
export async function searchPexelsVideos(
  keyword: string,
  perPage = 8,
): Promise<PexelsSearchItem[]> {
  const apiKey = process.env.PEXELS_API_KEY?.trim();
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
    headers: {
      Authorization: apiKey,
    },
    // 실시간 테마 변경용이므로 캐시는 끄고 최신 응답을 사용
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`pexels_search_failed:${res.status}`);
  }

  const data = (await res.json()) as PexelsSearchResponse;
  const videos = Array.isArray(data.videos) ? data.videos : [];

  return videos
    .map((video) => {
      const files = Array.isArray(video.video_files) ? video.video_files : [];
      // 가능한 한 큰 해상도 파일을 선택 (화질 우선)
      const bestFile = files
        .slice()
        .sort((a, b) => b.width * b.height - a.width * a.height)[0];
      if (!bestFile?.link) return null;

      return {
        id: video.id,
        videoUrl: bestFile.link,
        width: bestFile.width,
        height: bestFile.height,
      } satisfies PexelsSearchItem;
    })
    .filter((x): x is PexelsSearchItem => x !== null);
}

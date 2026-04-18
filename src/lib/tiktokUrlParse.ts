/**
 * TikTok 공유 URL에서 숫자 video id만 추출합니다.
 * 지원 예: https://www.tiktok.com/@handle/video/1234567890123456789
 * (vm.tiktok.com 단축 URL은 경로에 id가 없어 본 함수로는 추출 불가 — 리다이렉트 후 전체 URL 필요)
 */

/** 경로 기준 `/video/{숫자id}` (TikTok 영상 id는 보통 10~20자리) */
export const TIKTOK_VIDEO_ID_FROM_PATH_RE =
  /\/video\/(\d{10,20})(?:\?|[#/]|$)/;

export class TikTokUrlParseError extends Error {
  constructor(
    message: string,
    public readonly input?: string,
  ) {
    super(message);
    this.name = "TikTokUrlParseError";
  }
}

/**
 * @throws {TikTokUrlParseError} URL이 비었거나 tiktok 도메인이 아니거나 `/video/{id}` 패턴이 없을 때
 */
export function extractTikTokVideoIdFromUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new TikTokUrlParseError("URL이 비어 있습니다.", trimmed);
  }

  let u: URL;
  try {
    u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    throw new TikTokUrlParseError("URL 형식이 올바르지 않습니다.", trimmed);
  }

  const host = u.hostname.toLowerCase();
  if (!host.endsWith("tiktok.com")) {
    throw new TikTokUrlParseError("tiktok.com 주소가 아닙니다.", trimmed);
  }

  const m = u.pathname.match(TIKTOK_VIDEO_ID_FROM_PATH_RE);
  if (!m?.[1]) {
    throw new TikTokUrlParseError(
      "경로에 /video/{숫자id} 가 없습니다. 공유 링크 전체(단축 링크가 아닌 영상 페이지 URL)를 사용해 주세요.",
      trimmed,
    );
  }

  return m[1];
}

/** 잘못된 URL은 null, 유효하면 video id */
export function tryExtractTikTokVideoIdFromUrl(raw: string): string | null {
  try {
    return extractTikTokVideoIdFromUrl(raw);
  } catch {
    return null;
  }
}

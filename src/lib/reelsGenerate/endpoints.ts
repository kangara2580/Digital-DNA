/**
 * 엔드포인트/베이스 URL 설정 모듈.
 *
 * 핵심: 나중에 자체 AI 서버로 전환할 때 URL만 바꾸면 되도록,
 * 호출 경로를 여기 한 곳에서 관리한다.
 */

export const REELS_OWN_AI_BASE_URL = (process.env.REELS_AI_BASE_URL ?? "").trim();

/**
 * 자체 서버에 토큰이 필요하면 사용.
 * 예: Authorization: Bearer <token>
 */
export const REELS_OWN_AI_TOKEN = (process.env.REELS_AI_SERVER_TOKEN ?? "").trim();

export const REELS_PROVIDER_ENDPOINTS = {
  geminiStart:
    process.env.REELS_ENDPOINT_GEMINI_START ??
    "/v1/reels/generate/bg-face/start",
  geminiPoll:
    process.env.REELS_ENDPOINT_GEMINI_POLL ??
    "/v1/reels/generate/bg-face/jobs",

  klingStart:
    process.env.REELS_ENDPOINT_KLING_START ??
    "/v1/reels/generate/motion/start",
  klingPoll:
    process.env.REELS_ENDPOINT_KLING_POLL ??
    "/v1/reels/generate/motion/jobs",

  upscaleStart:
    process.env.REELS_ENDPOINT_UPSCALE_START ??
    "/v1/reels/generate/upscale/start",
  upscalePoll:
    process.env.REELS_ENDPOINT_UPSCALE_POLL ??
    "/v1/reels/generate/upscale/jobs",

  ffmpegEncode:
    process.env.REELS_ENDPOINT_FFMPEG_ENCODE ??
    "/v1/reels/generate/encode",
} as const;

export function isOwnAiServerEnabled(): boolean {
  return REELS_OWN_AI_BASE_URL.length > 0;
}

export function joinEndpoint(base: string, path: string): string {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

/**
 * 로그인 직후 이동할 **같은 호스트 안의** 상대 경로만 허용합니다. (오픈 리다이렉트 방지)
 * OAuth 쿼리 `next`·로그인 페이지 `redirect` 등에 공통으로 사용합니다.
 */
export function postLoginRedirectPath(raw: string | null): string {
  const fallback = "/";
  if (raw == null) return fallback;
  const t = String(raw).trim();
  if (!t.startsWith("/") || t.startsWith("//")) return fallback;
  if (t.includes("://") || t.includes("\\")) return fallback;
  return t;
}

/**
 * TikTok OAuth는 redirect_uri를 **문자열 전체**로 매칭합니다.
 * 경로 끝 `/` 유무(`/callback` vs `/callback/`)만 달라도 다른 값으로 취급되므로,
 * 앱에서 보내는 값을 한 형태로 통일합니다(콜백 경로는 슬래시 없음).
 */
export function normalizeTikTokRedirectUri(input: string): string {
  const trimmed = input.trim();
  try {
    const u = new URL(trimmed);
    if (u.pathname.endsWith("/") && u.pathname.length > 1) {
      u.pathname = u.pathname.replace(/\/+$/, "");
    }
    return u.toString();
  } catch {
    return trimmed;
  }
}

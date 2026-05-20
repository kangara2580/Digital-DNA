/**
 * Supabase OAuth `redirectTo`는 대시보드 → Authentication → Redirect URLs에
 * 등록된 `…/auth/callback` 과 origin이 정확히 일치해야 합니다.
 *
 * 기본: 요청/브라우저의 현재 origin.
 * 개발(`NODE_ENV=development`)에서만 고정 origin:
 * 1. `NEXTAUTH_URL` (최우선 — 로컬에서 `localhost` / `127.0.0.1` 혼선 완화)
 * 2. `NEXT_PUBLIC_DEV_AUTH_REDIRECT_ORIGIN`
 * 없으면 요청/브라우저 origin 그대로.
 */
function parsePublicOrigin(raw: string | undefined): string | null {
  const t = raw?.trim();
  if (!t) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(t) ? t : `https://${t}`;
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

function devForcedAuthOrigin(): string | null {
  if (process.env.NODE_ENV !== "development") return null;
  /** 로컬에서 `localhost` / `127.0.0.1` 혼선을 줄이기 위해 NEXTAUTH_URL을 최우선 */
  return (
    parsePublicOrigin(process.env.NEXTAUTH_URL) ??
    parsePublicOrigin(process.env.NEXT_PUBLIC_DEV_AUTH_REDIRECT_ORIGIN)
  );
}

export function resolveOAuthCallbackOriginFromRequest(requestOrigin: string): string {
  if (process.env.NODE_ENV === "development") {
    /**
     * PKCE verifier 쿠키는 `/api/auth/google/start` 를 연 **그 호스트**에만 붙습니다.
     * `NEXTAUTH_URL` 이 `localhost` 인데 브라우저가 `127.0.0.1` 이면 교환 실패 → 로그인으로 돌아감.
     */
    return requestOrigin;
  }
  return devForcedAuthOrigin() ?? requestOrigin;
}

/** 클라이언트에서 `signInWithOAuth`의 `redirectTo`를 만들 때 사용합니다. */
export function resolveOAuthCallbackOriginBrowser(): string {
  if (typeof window === "undefined") return "";
  return devForcedAuthOrigin() ?? window.location.origin;
}

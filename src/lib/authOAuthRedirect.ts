/** 브라우저에서 OAuth 완료 후 돌아올 URL (`next`는 앱 내 경로만 허용) */
export function buildAuthCallbackRedirectTo(nextPath: string | null): string {
  if (typeof window === "undefined") return "";
  const next =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
  const u = new URL("/auth/callback", window.location.origin);
  u.searchParams.set("next", next);
  return u.toString();
}

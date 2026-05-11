import type { CookieOptions } from "@supabase/ssr";

function envTriBool(raw: string | undefined): boolean | null {
  const t = raw?.trim().toLowerCase();
  if (t === "1" || t === "true" || t === "yes") return true;
  if (t === "0" || t === "false" || t === "no") return false;
  return null;
}

/**
 * Supabase Auth 쿠키 — 브라우저를 닫았다 열어도 세션이 유지되도록 긴 maxAge + path 통일.
 *
 * - `secure`: 기본은 `NODE_ENV === "production"` 일 때만 true (로컬 `http://` 에서 쿠키가 사라지지 않게).
 * - `SUPABASE_AUTH_COOKIE_SECURE=0|1` 로 강제할 수 있습니다 (예: 로컬에서 `production` 빌드를 띄울 때).
 */
export function getSupabaseAuthCookieOptions(): CookieOptions {
  const forced = envTriBool(process.env.SUPABASE_AUTH_COOKIE_SECURE);
  const secure =
    forced === true ? true : forced === false ? false : process.env.NODE_ENV === "production";

  return {
    path: "/",
    sameSite: "lax",
    secure,
    maxAge: 400 * 24 * 60 * 60,
  };
}

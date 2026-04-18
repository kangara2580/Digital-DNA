import type { CookieOptions } from "@supabase/ssr";

/**
 * Supabase Auth 쿠키 — 브라우저를 닫았다 열어도 세션이 유지되도록 긴 maxAge + path 통일.
 * (@supabase/ssr 기본값과 동일 계열, 배포 환경에서는 Secure)
 */
export function getSupabaseAuthCookieOptions(): CookieOptions {
  return {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 400 * 24 * 60 * 60,
  };
}

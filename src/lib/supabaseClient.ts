"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAuthCookieOptions } from "@/lib/supabaseCookieOptions";

function normalizeSupabaseUrl(raw: string | undefined): string | null {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    // 운영 중 실수로 `/reset-password` 같은 path가 env에 들어가도 origin으로 보정
    return parsed.origin;
  } catch {
    return null;
  }
}

const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * 브라우저용 Supabase — @supabase/ssr 가 세션을 쿠키에 저장하고,
 * `middleware.ts`에서 토큰을 갱신합니다 (localStorage 단독보다 새로고침 후 유지에 유리).
 * createBrowserClient 는 브라우저에서 싱글톤을 캐시합니다.
 */
export function getSupabaseBrowserClient() {
  if (!url || !anonKey) return null;
  return createBrowserClient(url, anonKey, {
    cookieOptions: getSupabaseAuthCookieOptions(),
  });
}

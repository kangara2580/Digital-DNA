import type { CookieOptions } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

type CookieStoreLike = {
  getAll(): { name: string; value: string }[];
  set(name: string, value: string, options?: CookieOptions): void;
  delete(name: string): void;
};

export type CookieToSet = {
  name: string;
  value: string;
  options?: CookieOptions;
};

export function getSupabaseProjectRef(supabaseUrl: string): string {
  try {
    return new URL(supabaseUrl).hostname.split(".")[0] ?? "";
  } catch {
    return "";
  }
}

export function isSupabaseAuthCookieName(name: string, projectRef: string): boolean {
  if (!projectRef) return false;
  return name === `sb-${projectRef}-auth-token` || name.startsWith(`sb-${projectRef}-auth-token.`);
}

/** 요청 Cookie 헤더에 실린 Supabase auth 청크 합(대략) */
export function totalSupabaseAuthCookieBytes(
  cookies: { name: string; value: string }[],
  projectRef: string,
): number {
  if (!projectRef) return 0;
  let total = 0;
  for (const { name, value } of cookies) {
    if (isSupabaseAuthCookieName(name, projectRef)) {
      total += name.length + value.length + 4;
    }
  }
  return total;
}

/** Chrome `ERR_RESPONSE_HEADERS_TOO_BIG` / HTTP 431 직전 구간 */
export const SUPABASE_AUTH_COOKIE_WARN_BYTES = 12_000;

/** 미들웨어·OAuth 콜백 — 낡은 auth-token 청크 쿠키 제거 후 새 값 설정 */
export function applySupabaseAuthCookies(
  request: NextRequest,
  response: NextResponse,
  cookiesToSet: CookieToSet[],
  projectRef: string,
): void {
  const namesToSet = new Set(cookiesToSet.map((c) => c.name));

  for (const { name } of request.cookies.getAll()) {
    if (isSupabaseAuthCookieName(name, projectRef) && !namesToSet.has(name)) {
      response.cookies.delete(name);
    }
  }

  for (const { name, value, options } of cookiesToSet) {
    if (options?.maxAge === 0 || value === "") {
      response.cookies.delete(name);
      continue;
    }
    response.cookies.set(name, value, options);
  }
}

export function clearAllSupabaseAuthCookies(
  request: NextRequest,
  response: NextResponse,
  projectRef: string,
): void {
  for (const { name } of request.cookies.getAll()) {
    if (isSupabaseAuthCookieName(name, projectRef)) {
      response.cookies.delete(name);
    }
  }
}

function purgeStaleAuthCookiesOnStore(
  store: CookieStoreLike,
  cookiesToSet: CookieToSet[],
  projectRef: string,
): void {
  const namesToSet = new Set(cookiesToSet.map((c) => c.name));
  for (const { name } of store.getAll()) {
    if (isSupabaseAuthCookieName(name, projectRef) && !namesToSet.has(name)) {
      store.delete(name);
    }
  }
}

/** Route Handler `cookies()` — 낡은 auth 청크 삭제 후 설정 */
export function applySupabaseAuthCookiesToStore(
  store: CookieStoreLike,
  cookiesToSet: CookieToSet[],
  projectRef: string,
): void {
  purgeStaleAuthCookiesOnStore(store, cookiesToSet, projectRef);
  for (const { name, value, options } of cookiesToSet) {
    if (options?.maxAge === 0 || value === "") {
      store.delete(name);
      continue;
    }
    store.set(name, value, options);
  }
}

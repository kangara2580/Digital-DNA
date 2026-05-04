import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { POST_LOGIN_REDIRECT_PATH } from "@/lib/postLoginRedirect";
import { getSupabaseAuthCookieOptions } from "@/lib/supabaseCookieOptions";

/**
 * OAuth 리다이렉트 전용 Route Handler — HTML을 렌더링하지 않으므로 `generateMetadata`는
 * 적용되지 않습니다. 탭 제목·검색 스니펫은 이전 페이지 또는 `/login` 등 최종 목적지
 * 메타가 유지됩니다.
 */

/** Edge가 아닌 Node에서 Supabase Auth HTTP 호출 안정화 */
export const runtime = "nodejs";

const FALLBACK_SUPABASE_ORIGIN = "https://ynlfcnezvieqzultbklf.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_6UqQ0Aqd5OlxM8U3KCtLWQ_g_1VZ9dc";

function normalizeSupabaseOrigin(raw: string | undefined): string | null {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

function oauthErrorRedirect(origin: string, reason?: string): NextResponse {
  const url = new URL("/login?error=oauth", origin);
  const trimmed = (reason ?? "").trim();
  if (trimmed) {
    url.searchParams.set("reason", trimmed.slice(0, 220));
  }
  return NextResponse.redirect(url);
}

function isTransientNetworkAuthError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("fetch failed") ||
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("econnreset") ||
    m.includes("etimedout") ||
    m.includes("socket hang up") ||
    m.includes("enotfound")
  );
}

async function exchangeCodeWithRetry(
  supabase: ReturnType<typeof createServerClient>,
  code: string,
): Promise<{ error: { message: string } | null }> {
  let last = "exchange_failed";
  /** OAuth code는 성공 시 한 번만 유효 — 과도한 재시도는 invalid_grant 위험이 있어 2회만 */
  for (let attempt = 0; attempt < 2; attempt++) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return { error: null };
    last = error.message || "exchange_failed";
    if (!isTransientNetworkAuthError(last) || attempt === 1) {
      return { error: { message: last } };
    }
    await new Promise((r) => setTimeout(r, 320));
  }
  return { error: { message: last } };
}

/**
 * Supabase OAuth(PKCE) 콜백 — `signInWithOAuth` 후 Google 등에서 리다이렉트됩니다.
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function GET(request: NextRequest) {
  const supabaseUrl =
    normalizeSupabaseOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL) ??
    FALLBACK_SUPABASE_ORIGIN;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    FALLBACK_SUPABASE_PUBLISHABLE_KEY;
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const providerError =
    requestUrl.searchParams.get("error_description") ||
    requestUrl.searchParams.get("error") ||
    "";
  if (providerError) {
    return oauthErrorRedirect(requestUrl.origin, providerError);
  }

  if (!supabaseUrl || !anonKey || !code) {
    return oauthErrorRedirect(requestUrl.origin, "missing_code_or_config");
  }

  const redirectTo = new URL(POST_LOGIN_REDIRECT_PATH, requestUrl.origin);
  const response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookieOptions: getSupabaseAuthCookieOptions(),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { error: exchangeErr } = await exchangeCodeWithRetry(supabase, code);
  if (exchangeErr) {
    return oauthErrorRedirect(requestUrl.origin, exchangeErr.message || "exchange_failed");
  }

  return response;
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAuthCookieOptions } from "@/lib/supabaseCookieOptions";

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
  const nextRaw = requestUrl.searchParams.get("next");
  const next =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/";

  if (providerError) {
    return oauthErrorRedirect(requestUrl.origin, providerError);
  }

  if (!supabaseUrl || !anonKey || !code) {
    return oauthErrorRedirect(requestUrl.origin, "missing_code_or_config");
  }

  const redirectTo = new URL(next, requestUrl.origin);
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

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return oauthErrorRedirect(requestUrl.origin, error.message || "exchange_failed");
  }

  return response;
}

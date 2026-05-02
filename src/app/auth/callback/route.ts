import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAuthCookieOptions } from "@/lib/supabaseCookieOptions";
import { syncProfileFromAuthUser } from "@/lib/supabaseProfiles";

export const runtime = "nodejs";

function normalizeSupabaseOrigin(raw: string | undefined): string | null {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

function safeNextPath(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

function callbackFailureRedirect(
  origin: string,
  reason: string,
  status = "oauth_callback_failed",
): NextResponse {
  const url = new URL("/login", origin);
  url.searchParams.set("error", status);
  url.searchParams.set("reason", reason.slice(0, 220));
  return NextResponse.redirect(url);
}

function envStatus() {
  return {
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    hasSupabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
  };
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

  for (let attempt = 0; attempt < 2; attempt++) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return { error: null };

    last = error.message || "exchange_failed";
    if (!isTransientNetworkAuthError(last) || attempt === 1) {
      return { error: { message: last } };
    }
    await new Promise((resolve) => setTimeout(resolve, 320));
  }

  return { error: { message: last } };
}

/**
 * Supabase OAuth callback.
 *
 * Required external settings:
 * - Google Cloud Authorized redirect URI:
 *   https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback
 * - Supabase Redirect URLs:
 *   https://digital-dna-aeya-live.vercel.app/auth/callback
 *   http://localhost:3001/auth/callback
 */
export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const code = requestUrl.searchParams.get("code");
  const providerError =
    requestUrl.searchParams.get("error_description") ||
    requestUrl.searchParams.get("error") ||
    "";
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  if (providerError) {
    console.error("[oauth:callback] provider returned error", {
      providerError,
      origin: requestUrl.origin,
    });
    return callbackFailureRedirect(requestUrl.origin, providerError);
  }

  if (!code) {
    console.error("[oauth:callback] missing code", {
      origin: requestUrl.origin,
      pathname: requestUrl.pathname,
      searchParams: Array.from(requestUrl.searchParams.keys()),
      env: envStatus(),
    });
    return callbackFailureRedirect(requestUrl.origin, "missing_code");
  }

  const supabaseUrl = normalizeSupabaseOrigin(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!supabaseUrl || !anonKey) {
    const reason = !supabaseUrl
      ? "missing_NEXT_PUBLIC_SUPABASE_URL"
      : "missing_NEXT_PUBLIC_SUPABASE_ANON_KEY";
    console.error("[oauth:callback] missing Supabase env", {
      reason,
      env: envStatus(),
    });
    return callbackFailureRedirect(requestUrl.origin, reason);
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

  const { error: exchangeErr } = await exchangeCodeWithRetry(supabase, code);
  if (exchangeErr) {
    console.error("[oauth:callback] exchangeCodeForSession failed", {
      message: exchangeErr.message,
      origin: requestUrl.origin,
      redirectTo: redirectTo.toString(),
    });
    return callbackFailureRedirect(
      requestUrl.origin,
      exchangeErr.message || "exchange_failed",
    );
  }

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) {
    console.error("[oauth:callback] getUser failed after exchange", {
      message: userErr.message,
    });
  }

  if (user) {
    await syncProfileFromAuthUser(supabase, user);
  }

  return response;
}

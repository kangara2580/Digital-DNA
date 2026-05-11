import { createServerClient } from "@supabase/ssr";
import type { AuthError } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { syncProfileFromAuthUserAsServer } from "@/lib/serverProfileSync";
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
): Promise<{ error: AuthError | Error | null }> {
  let last: AuthError | Error = new Error("exchange_failed");

  for (let attempt = 0; attempt < 2; attempt++) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return { error: null };

    last = error;
    if (!isTransientNetworkAuthError(error.message || "") || attempt === 1) {
      return { error };
    }
    await new Promise((resolve) => setTimeout(resolve, 320));
  }

  return { error: last };
}

/**
 * Supabase OAuth callback.
 *
 * Required external settings:
 * - Google Cloud Authorized redirect URI:
 *   https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback
 * - Supabase Redirect URLs:
 *   https://ara.pink/auth/callback
 *   http://localhost:3001/auth/callback
 */
export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const providerError =
    errorDescription ||
    error ||
    "";
  const next = safeNextPath(requestUrl.searchParams.get("next"));
  const supabaseUrl = normalizeSupabaseOrigin(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  console.log("[oauth:callback] received callback", {
    href: requestUrl.href,
    searchParams: Object.fromEntries(requestUrl.searchParams.entries()),
    codeExists: Boolean(code),
    error,
    error_description: errorDescription,
    supabaseUrlExists: Boolean(supabaseUrl),
    supabaseAnonKeyExists: Boolean(anonKey),
  });

  if (providerError) {
    console.log("[oauth:callback] provider returned error", {
      href: requestUrl.href,
      searchParams: Object.fromEntries(requestUrl.searchParams.entries()),
      codeExists: Boolean(code),
      error,
      error_description: errorDescription,
      providerError,
      supabaseUrlExists: Boolean(supabaseUrl),
      supabaseAnonKeyExists: Boolean(anonKey),
    });
    return callbackFailureRedirect(requestUrl.origin, providerError);
  }

  if (!code) {
    console.log("[oauth:callback] missing code", {
      href: requestUrl.href,
      searchParams: Object.fromEntries(requestUrl.searchParams.entries()),
      searchParamKeys: Array.from(requestUrl.searchParams.keys()),
      codeExists: false,
      error,
      error_description: errorDescription,
      supabaseUrlExists: Boolean(supabaseUrl),
      supabaseAnonKeyExists: Boolean(anonKey),
    });
    return callbackFailureRedirect(requestUrl.origin, "missing_code");
  }

  if (!supabaseUrl || !anonKey) {
    const reason = !supabaseUrl
      ? "missing_NEXT_PUBLIC_SUPABASE_URL"
      : "missing_NEXT_PUBLIC_SUPABASE_ANON_KEY";
    console.log("[oauth:callback] missing Supabase env", {
      reason,
      href: requestUrl.href,
      searchParams: Object.fromEntries(requestUrl.searchParams.entries()),
      codeExists: Boolean(code),
      error,
      error_description: errorDescription,
      supabaseUrlExists: Boolean(supabaseUrl),
      supabaseAnonKeyExists: Boolean(anonKey),
      env: envStatus(),
    });
    return callbackFailureRedirect(requestUrl.origin, reason);
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
    const errWithStatus = exchangeErr as AuthError & { status?: number };
    console.log("[oauth:callback] exchangeCodeForSession failed", {
      message: exchangeErr.message,
      status: errWithStatus.status ?? null,
      name: exchangeErr.name ?? null,
      href: requestUrl.href,
      searchParams: Object.fromEntries(requestUrl.searchParams.entries()),
      codeExists: Boolean(code),
      error,
      error_description: errorDescription,
      supabaseUrlExists: Boolean(supabaseUrl),
      supabaseAnonKeyExists: Boolean(anonKey),
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
    console.log("[oauth:callback] getUser failed after exchange", {
      message: userErr.message,
      status: userErr.status ?? null,
      name: userErr.name ?? null,
    });
  }

  if (user) {
    const profile = await syncProfileFromAuthUser(supabase, user);
    if (!profile) {
      await syncProfileFromAuthUserAsServer(user);
    }
  }

  return response;
}

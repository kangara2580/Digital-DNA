import { createServerClient } from "@supabase/ssr";
import type { AuthError } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { postLoginRedirectPath } from "@/lib/postLoginRedirect";
import { resolveOAuthCallbackOriginFromRequest } from "@/lib/oauthCallbackOrigin";
import { getAuthAppBaseUrl } from "@/lib/authAppBaseUrl";
import { syncProfileFromAuthUserAsServer } from "@/lib/serverProfileSync";
import { getSupabaseAuthCookieOptions } from "@/lib/supabaseCookieOptions";
import {
  applySupabaseAuthCookies,
  clearAllSupabaseAuthCookies,
  getSupabaseProjectRef,
} from "@/lib/supabaseAuthCookies";
import { exchangeOAuthCodeForLeanSession } from "@/lib/supabaseAuthExchange";
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

function callbackFailureRedirect(
  origin: string,
  reason: string,
  status = "oauth_callback_failed",
): NextResponse {
  const url = new URL("/login", origin);
  url.searchParams.set("error", "oauth");
  url.searchParams.set("oauth_status", status);
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

/**
 * Supabase OAuth callback.
 *
 * Required external settings:
 * - Google Cloud Authorized redirect URI:
 *   https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback
 * - Supabase Redirect URLs: 앱이 실제로 열리는 origin마다
 *   `{origin}/auth/callback` (로컬 예: `NEXTAUTH_URL` 또는 `http://localhost:3000/auth/callback`)
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
  const afterLoginPath = postLoginRedirectPath(requestUrl.searchParams.get("next"));
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
    authAppBaseUrl: getAuthAppBaseUrl(),
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

  const destOrigin = resolveOAuthCallbackOriginFromRequest(requestUrl.origin);
  const redirectTo = new URL(afterLoginPath, destOrigin);
  const response = NextResponse.redirect(redirectTo);

  const projectRef = getSupabaseProjectRef(supabaseUrl);
  clearAllSupabaseAuthCookies(request, response, projectRef);

  let exchangeErr: Error | null = null;
  let leanSession: Awaited<
    ReturnType<typeof exchangeOAuthCodeForLeanSession>
  >["session"] = null;
  let leanUser: Awaited<ReturnType<typeof exchangeOAuthCodeForLeanSession>>["user"] =
    null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await exchangeOAuthCodeForLeanSession(
      supabaseUrl,
      anonKey,
      code,
      request.cookies.getAll(),
    );
    if (!result.error && result.session) {
      leanSession = result.session;
      leanUser = result.user;
      exchangeErr = null;
      break;
    }
    exchangeErr = result.error;
    if (
      !exchangeErr ||
      !isTransientNetworkAuthError(exchangeErr.message || "") ||
      attempt === 1
    ) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 320));
  }

  if (exchangeErr || !leanSession) {
    const errWithStatus = exchangeErr as AuthError & { status?: number };
    console.log("[oauth:callback] exchangeCodeForSession failed", {
      message: exchangeErr?.message ?? "no_session",
      status: errWithStatus?.status ?? null,
      name: exchangeErr?.name ?? null,
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
      exchangeErr?.message || "exchange_failed",
    );
  }

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookieOptions: getSupabaseAuthCookieOptions(),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        applySupabaseAuthCookies(request, response, cookiesToSet, projectRef);
      },
    },
  });

  const { error: setSessionErr } = await supabase.auth.setSession({
    access_token: leanSession.access_token,
    refresh_token: leanSession.refresh_token,
  });

  if (setSessionErr) {
    console.log("[oauth:callback] setSession failed", {
      message: setSessionErr.message,
    });
    return callbackFailureRedirect(
      requestUrl.origin,
      setSessionErr.message || "set_session_failed",
    );
  }

  const activeUser = leanUser ?? leanSession.user;
  if (activeUser) {
    const profile = await syncProfileFromAuthUser(supabase, activeUser);
    if (!profile) {
      await syncProfileFromAuthUserAsServer(activeUser);
    }
  }

  if (process.env.NODE_ENV === "development") {
    response.cookies.set("dev_oauth_return", "1", {
      path: "/",
      maxAge: 180,
      sameSite: "lax",
      secure: false,
      httpOnly: false,
    });
  }

  return response;
}

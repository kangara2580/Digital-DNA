import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { resolveOAuthCallbackOriginFromRequest } from "@/lib/oauthCallbackOrigin";
import { postLoginRedirectPath } from "@/lib/postLoginRedirect";
import { getSupabaseAuthCookieOptions } from "@/lib/supabaseCookieOptions";

export const runtime = "nodejs";

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

function envStatus() {
  return {
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    hasSupabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
    hasPublicSiteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
    hasVercelProductionUrl: Boolean(
      process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim(),
    ),
    hasVercelUrl: Boolean(process.env.VERCEL_URL?.trim()),
  };
}

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const supabaseOrigin = normalizeSupabaseOrigin(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!supabaseOrigin || !anonKey) {
    console.log("[oauth:start] missing Supabase env", {
      origin: reqUrl.origin,
      redirectTo: null,
      generatedAuthUrl: null,
      supabaseUrlExists: Boolean(supabaseOrigin),
      supabaseAnonKeyExists: Boolean(anonKey),
      env: envStatus(),
    });
    const errorUrl = new URL("/login", reqUrl.origin);
    errorUrl.searchParams.set("error", "oauth_start_failed");
    errorUrl.searchParams.set(
      "reason",
      !supabaseOrigin
        ? "missing_NEXT_PUBLIC_SUPABASE_URL"
        : "missing_NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
    return NextResponse.redirect(errorUrl);
  }

  const nextPath = postLoginRedirectPath(reqUrl.searchParams.get("next"));
  const siteOrigin = resolveOAuthCallbackOriginFromRequest(reqUrl.origin);
  const redirectTo = new URL("/auth/callback", siteOrigin);
  redirectTo.searchParams.set("next", nextPath);

  const cookiesToSet: {
    name: string;
    value: string;
    options: Parameters<NextResponse["cookies"]["set"]>[2];
  }[] = [];

  const supabase = createServerClient(supabaseOrigin, anonKey, {
    cookieOptions: getSupabaseAuthCookieOptions(),
    cookies: {
      getAll() {
        return [];
      },
      setAll(items) {
        cookiesToSet.push(
          ...items.map(({ name, value, options }) => ({ name, value, options })),
        );
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectTo.toString(),
      skipBrowserRedirect: true,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    console.log("[oauth:start] Supabase signInWithOAuth failed", {
      origin: reqUrl.origin,
      redirectTo: redirectTo.toString(),
      generatedAuthUrl: null,
      message: error?.message ?? null,
      status: error?.status ?? null,
      name: error?.name ?? null,
      supabaseUrlExists: Boolean(supabaseOrigin),
      supabaseAnonKeyExists: Boolean(anonKey),
      env: envStatus(),
    });
    const errorUrl = new URL("/login", reqUrl.origin);
    errorUrl.searchParams.set("error", "oauth_start_failed");
    errorUrl.searchParams.set("reason", error?.message || "missing_auth_url");
    return NextResponse.redirect(errorUrl);
  }

  console.log("[oauth:start] generated Google OAuth URL", {
    origin: reqUrl.origin,
    redirectTo: redirectTo.toString(),
    generatedAuthUrl: data.url.replace(anonKey, "[redacted]"),
    supabaseUrlExists: Boolean(supabaseOrigin),
    supabaseAnonKeyExists: Boolean(anonKey),
    pkceCookieCount: cookiesToSet.length,
    env: envStatus(),
  });

  const response = NextResponse.redirect(data.url);
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}

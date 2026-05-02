import { NextResponse } from "next/server";

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

function safeNextPath(raw: string | null): string {
  if (!raw) return "/";
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

function isLocalOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function resolveSiteOrigin(fallbackOrigin: string): string {
  if (process.env.NODE_ENV !== "production" && isLocalOrigin(fallbackOrigin)) {
    return fallbackOrigin;
  }

  const raw =
    [
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.NEXTAUTH_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
    ]
      .map((value) => value?.trim())
      .find(Boolean) ?? "";
  if (!raw) return fallbackOrigin;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return fallbackOrigin;
  }
}

function envStatus() {
  return {
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    hasSupabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
    hasPublicSiteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
    hasNextAuthUrl: Boolean(process.env.NEXTAUTH_URL?.trim()),
    hasVercelProductionUrl: Boolean(
      process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim(),
    ),
  };
}

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const supabaseOrigin = normalizeSupabaseOrigin(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!supabaseOrigin || !anonKey) {
    console.error("[oauth:start] missing Supabase env", envStatus());
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

  const nextPath = safeNextPath(reqUrl.searchParams.get("next"));
  const siteOrigin = resolveSiteOrigin(reqUrl.origin);
  const redirectTo = new URL("/auth/callback", siteOrigin);
  redirectTo.searchParams.set("next", nextPath);

  const authUrl = new URL("/auth/v1/authorize", supabaseOrigin);
  authUrl.searchParams.set("provider", "google");
  authUrl.searchParams.set("redirect_to", redirectTo.toString());
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("apikey", anonKey);

  console.info("[oauth:start] generated Google OAuth URL", {
    origin: reqUrl.origin,
    redirectTo: redirectTo.toString(),
    supabaseAuthorizeUrl: authUrl.toString().replace(anonKey, "[redacted]"),
    env: envStatus(),
  });

  return NextResponse.redirect(authUrl);
}

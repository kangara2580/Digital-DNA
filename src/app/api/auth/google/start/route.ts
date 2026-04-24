import { NextResponse } from "next/server";

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

function safeNextPath(raw: string | null): string {
  if (!raw) return "/";
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const supabaseOrigin =
    normalizeSupabaseOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL) ??
    FALLBACK_SUPABASE_ORIGIN;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    FALLBACK_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseOrigin || !anonKey) {
    return NextResponse.redirect(new URL("/login?error=oauth", reqUrl.origin));
  }

  const nextPath = safeNextPath(reqUrl.searchParams.get("next"));
  const redirectTo = new URL("/auth/callback", reqUrl.origin);
  redirectTo.searchParams.set("next", nextPath);

  const authUrl = new URL("/auth/v1/authorize", supabaseOrigin);
  authUrl.searchParams.set("provider", "google");
  authUrl.searchParams.set("redirect_to", redirectTo.toString());
  authUrl.searchParams.set("prompt", "select_account");
  authUrl.searchParams.set("apikey", anonKey);

  return NextResponse.redirect(authUrl);
}

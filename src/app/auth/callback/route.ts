import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAuthCookieOptions } from "@/lib/supabaseCookieOptions";

/**
 * Supabase OAuth(PKCE) 콜백 — `signInWithOAuth` 후 Google 등에서 리다이렉트됩니다.
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextRaw = requestUrl.searchParams.get("next");
  const next =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/";

  if (!supabaseUrl?.length || !anonKey?.length || !code) {
    return NextResponse.redirect(new URL("/login?error=oauth", requestUrl.origin));
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
    return NextResponse.redirect(new URL("/login?error=oauth", requestUrl.origin));
  }

  return response;
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { attachLocalePreferenceCookie } from "@/lib/localeCookieMiddleware";
import { CANONICAL_SITE_ORIGIN } from "@/lib/siteMetadataBase";
import { getSupabaseAuthCookieOptions } from "@/lib/supabaseCookieOptions";

function canonicalHostFromEnv(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const candidate = raw || CANONICAL_SITE_ORIGIN;
  try {
    const withProtocol = /^https?:\/\//i.test(candidate)
      ? candidate
      : `https://${candidate}`;
    return new URL(withProtocol).host;
  } catch {
    return null;
  }
}

function withLocale(request: NextRequest, response: NextResponse) {
  return attachLocalePreferenceCookie(request, response);
}

function shouldRedirectVercelAuthSurfaceToCanonical(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  );
}

export async function middleware(request: NextRequest) {
  const tsdMirrorRoutes: Record<string, string> = {
    "/chapter-1": "/tsd-mirror/chapter-1/index.html",
    "/chapter-2": "/tsd-mirror/chapter-2/index.html",
    "/chapter-3": "/tsd-mirror/chapter-3/index.html",
    "/chapter-4": "/tsd-mirror/chapter-4/index.html",
    "/chapter-5": "/tsd-mirror/chapter-5/index.html",
  };
  const pathname = request.nextUrl.pathname;
  const referer = request.headers.get("referer") || "";
  const fromThroughSlidingDoors =
    referer.includes("/through-sliding-doors") || referer.includes("/tsd-mirror/");

  if (pathname in tsdMirrorRoutes) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = tsdMirrorRoutes[pathname];
    rewriteUrl.search = "";
    return withLocale(request, NextResponse.rewrite(rewriteUrl));
  }

  if (fromThroughSlidingDoors && pathname === "/about") {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = "/tsd-mirror/about/index.html";
    rewriteUrl.search = "";
    return withLocale(request, NextResponse.rewrite(rewriteUrl));
  }

  if (fromThroughSlidingDoors && pathname === "/") {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = "/tsd-mirror/index.html";
    rewriteUrl.search = "";
    return withLocale(request, NextResponse.rewrite(rewriteUrl));
  }

  if (pathname === "/%20auth/callback") {
    const fixed = request.nextUrl.clone();
    fixed.pathname = "/auth/callback";
    return withLocale(request, NextResponse.redirect(fixed));
  }

  const canonicalHost = canonicalHostFromEnv();
  const requestHost = request.nextUrl.host;
  if (
    process.env.NODE_ENV === "production" &&
    canonicalHost &&
    requestHost !== canonicalHost &&
    requestHost.endsWith(".vercel.app") &&
    shouldRedirectVercelAuthSurfaceToCanonical(pathname)
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.host = canonicalHost;
    redirectUrl.protocol = "https:";
    return withLocale(request, NextResponse.redirect(redirectUrl));
  }

  const maybeRecoveryCodeAtRoot =
    pathname === "/" &&
    request.nextUrl.searchParams.has("code") &&
    request.nextUrl.searchParams.get("type") === "recovery";
  if (maybeRecoveryCodeAtRoot) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/reset-password";
    return withLocale(request, NextResponse.redirect(redirectUrl));
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const needsAuth =
    pathname.startsWith("/mypage") ||
    pathname.startsWith("/sell") ||
    pathname.startsWith("/upload") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/");

  if (!url?.length || !key?.length) {
    return withLocale(request, NextResponse.next({ request }));
  }

  if (!needsAuth) {
    return withLocale(request, NextResponse.next({ request }));
  }

  let supabaseResponse = NextResponse.next({ request });
  const cookieBase = getSupabaseAuthCookieOptions();

  const supabase = createServerClient(url, key, {
    cookieOptions: cookieBase,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
      return withLocale(request, NextResponse.redirect(redirectUrl));
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("account_status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (
      profile &&
      typeof profile.account_status === "string" &&
      profile.account_status !== "active"
    ) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/account-suspended";
      redirectUrl.search = "";
      redirectUrl.searchParams.set("status", profile.account_status);
      return withLocale(request, NextResponse.redirect(redirectUrl));
    }
  } catch {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
    return withLocale(request, NextResponse.redirect(redirectUrl));
  }

  return withLocale(request, supabaseResponse);
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAuthCookieOptions } from "@/lib/supabaseCookieOptions";

function canonicalHostFromEnv(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return null;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol).host;
  } catch {
    return null;
  }
}

function isSensitiveAuthPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/auth/callback"
  );
}

/**
 * Supabase 세션 쿠키를 미들웨어에서 갱신합니다.
 * 브라우저만 쓰던 localStorage 세션보다 새로고침·탭 간 일관성이 좋습니다.
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function middleware(request: NextRequest) {
  const canonicalHost = canonicalHostFromEnv();
  const requestHost = request.nextUrl.host;

  // preview 도메인에서 인증/비밀번호 페이지 접근을 차단하고 canonical 도메인으로 유도
  if (
    process.env.NODE_ENV === "production" &&
    canonicalHost &&
    requestHost !== canonicalHost &&
    requestHost.endsWith(".vercel.app") &&
    isSensitiveAuthPath(request.nextUrl.pathname)
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.host = canonicalHost;
    redirectUrl.protocol = "https:";
    return NextResponse.redirect(redirectUrl);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const needsAuth = request.nextUrl.pathname.startsWith("/mypage");

  // 일부 환경에서 recovery 메일이 "/?code=..." 형태로 돌아오는 경우만
  // reset-password 화면으로 유도합니다.
  // OAuth 로그인(code)은 여기서 가로채지 않도록 type=recovery일 때만 처리합니다.
  const maybeRecoveryCodeAtRoot =
    request.nextUrl.pathname === "/" &&
    request.nextUrl.searchParams.has("code") &&
    request.nextUrl.searchParams.get("type") === "recovery";
  if (maybeRecoveryCodeAtRoot) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/reset-password";
    return NextResponse.redirect(redirectUrl);
  }

  if (!url?.length || !key?.length) {
    return NextResponse.next({ request });
  }

  // 비로그인 접근이 허용된 페이지는 Supabase 사용자 조회를 건너뛰어
  // DNS/네트워크 불안정 시 네비게이션이 멈추는 현상을 방지합니다.
  if (!needsAuth) {
    return NextResponse.next({ request });
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

  // createServerClient 직후 다른 로직을 끼우면 세션/로그아웃 버그가 나기 쉬움 — getUser()만 호출
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      const returnTo = request.nextUrl.pathname + request.nextUrl.search;
      redirectUrl.searchParams.set("redirect", returnTo);
      return NextResponse.redirect(redirectUrl);
    }
  } catch {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    const returnTo = request.nextUrl.pathname + request.nextUrl.search;
    redirectUrl.searchParams.set("redirect", returnTo);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * /api/* 제외 — 미들웨어가 요청 본문을 복제·버퍼링할 때 기본 한도를 넘는 multipart(동영상 업로드)가
     * 잘리면 formData/파서가 실패할 수 있음. API는 Bearer 등으로 인증하고, 페이지 네비게이션에서만 세션 쿠키를 갱신합니다.
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

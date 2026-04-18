import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAuthCookieOptions } from "@/lib/supabaseCookieOptions";

/**
 * Supabase 세션 쿠키를 미들웨어에서 갱신합니다.
 * 브라우저만 쓰던 localStorage 세션보다 새로고침·탭 간 일관성이 좋습니다.
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.length || !key?.length) {
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /** 마이페이지만 로그인 필요 — 메인 등은 비회원도 볼 수 있음 */
  if (request.nextUrl.pathname.startsWith("/mypage") && !user) {
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

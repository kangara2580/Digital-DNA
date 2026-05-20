import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAuthCookieOptions } from "@/lib/supabaseCookieOptions";
import {
  clearAllSupabaseAuthCookies,
  getSupabaseProjectRef,
} from "@/lib/supabaseAuthCookies";

export const runtime = "nodejs";

/** HTTP 431·쿠키 과다 시 — Supabase auth 쿠키 전부 삭제 후 로그인 화면 */
export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const origin = request.nextUrl.origin;
  const redirect = new URL("/login", origin);
  redirect.searchParams.set("hint", "session_cleared");

  const response = NextResponse.redirect(redirect);

  if (url) {
    const projectRef = getSupabaseProjectRef(url);
    clearAllSupabaseAuthCookies(request, response, projectRef);
    for (const { name } of request.cookies.getAll()) {
      if (name.startsWith("sb-")) {
        response.cookies.delete(name);
      }
    }
  }

  response.cookies.set("session_repair_pending", "1", {
    ...getSupabaseAuthCookieOptions(),
    maxAge: 120,
    httpOnly: false,
  });

  return response;
}

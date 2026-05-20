import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { repairOversizedAuthUserMetadata } from "@/lib/repairAuthUserMetadata";
import { getSupabaseAuthCookieOptions } from "@/lib/supabaseCookieOptions";
import {
  applySupabaseAuthCookiesToStore,
  getSupabaseProjectRef,
} from "@/lib/supabaseAuthCookies";

export const runtime = "nodejs";

/** 로그인 후 JWT에 박힌 프로필 이미지 blob 제거 + 세션 쿠키 재발급 */
export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ ok: false, error: "config" }, { status: 503 });
  }

  const projectRef = getSupabaseProjectRef(supabaseUrl);
  const cookieStore = await cookies();

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookieOptions: getSupabaseAuthCookieOptions(),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        applySupabaseAuthCookiesToStore(cookieStore, cookiesToSet, projectRef);
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const repaired = await repairOversizedAuthUserMetadata(user);
  if (!repaired) {
    return NextResponse.json({ ok: true, repaired: false });
  }

  const { error: refreshErr } = await supabase.auth.refreshSession();
  if (refreshErr) {
    return NextResponse.json(
      { ok: false, error: "refresh_failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, repaired: true });
}

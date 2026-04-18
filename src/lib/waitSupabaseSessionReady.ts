import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 브라우저 Supabase 클라이언트에 세션 JWT가 붙은 뒤 RLS 쿼리·insert가 동작합니다.
 * getSession() 직후 레이스로 빈 결과/거부가 나오는 경우를 줄입니다.
 */
export async function waitForSupabaseAccessToken(
  supabase: SupabaseClient,
  maxAttempts = 8,
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) return true;
    await new Promise((r) => setTimeout(r, 80 * (i + 1)));
  }
  return false;
}

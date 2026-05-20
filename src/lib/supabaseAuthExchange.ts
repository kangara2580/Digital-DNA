import { createServerClient } from "@supabase/ssr";
import type { Session, User } from "@supabase/supabase-js";
import { repairOversizedAuthUserMetadata } from "@/lib/repairAuthUserMetadata";
import { isOversizedAuthAvatarCustom } from "@/lib/profileAvatarStorage";
import { getSupabaseAuthCookieOptions } from "@/lib/supabaseCookieOptions";
import type { CookieToSet } from "@/lib/supabaseAuthCookies";

/**
 * OAuth code → 세션. **요청 쿠키(PKCE verifier 포함)** 로 교환하고,
 * 응답 Set-Cookie는 쓰지 않습니다(콜백에서 setSession 1회만).
 */
export async function exchangeOAuthCodeForLeanSession(
  supabaseUrl: string,
  anonKey: string,
  code: string,
  requestCookies: { name: string; value: string }[],
): Promise<{
  session: Session | null;
  user: User | null;
  error: Error | null;
}> {
  const client = createServerClient(supabaseUrl, anonKey, {
    cookieOptions: getSupabaseAuthCookieOptions(),
    cookies: {
      getAll() {
        return requestCookies;
      },
      setAll(_cookiesToSet: CookieToSet[]) {
        /* 교환 중 JWT를 응답에 쓰지 않음 — 431 방지 */
      },
    },
  });

  const { data, error } = await client.auth.exchangeCodeForSession(code);
  if (error) {
    return { session: null, user: null, error };
  }
  if (!data.session) {
    return { session: null, user: null, error: new Error("no_session") };
  }

  let session = data.session;
  let user = data.user ?? session.user;

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  if (isOversizedAuthAvatarCustom(meta.avatar_custom)) {
    let repaired = await repairOversizedAuthUserMetadata(user);
    if (!repaired) {
      const { error: updateErr } = await client.auth.updateUser({
        data: { avatar_custom: null },
      });
      repaired = !updateErr;
    }
    if (repaired) {
      const { data: refreshed, error: refreshErr } = await client.auth.refreshSession();
      if (!refreshErr && refreshed.session) {
        session = refreshed.session;
        user = refreshed.user ?? user;
      }
    }
  }

  return { session, user, error: null };
}

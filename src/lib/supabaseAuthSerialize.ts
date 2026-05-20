import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { isTransientSupabaseFetchError } from "@/lib/supabaseNetworkError";

/** Supabase 브라우저 클라이언트 auth 락 충돌 방지 — getUser/updateUser 직렬화 */
let authChain: Promise<unknown> = Promise.resolve();

export function serializeSupabaseAuth<T>(fn: () => Promise<T>): Promise<T> {
  const run = authChain.then(fn, fn) as Promise<T>;
  authChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function isAuthLockError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("lock") ||
    msg.includes("steal") ||
    err.name === "AbortError"
  );
}

/** `getUser()` — 락 경합 시 세션 user 폴백 */
export async function getAuthUserSafe(
  supabase: SupabaseClient,
  fallback: User,
): Promise<User> {
  return serializeSupabaseAuth(async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data?.user ?? fallback;
    } catch (err) {
      if (isAuthLockError(err) || isTransientSupabaseFetchError(err)) return fallback;
      throw err;
    }
  });
}

/** `getSession()` — 네트워크 순간 끊김 시 null (콘솔 Failed to fetch 방지) */
export async function getAuthSessionSafe(
  supabase: SupabaseClient,
): Promise<{ session: Session | null; error: Error | null }> {
  return serializeSupabaseAuth(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        if (isTransientSupabaseFetchError(error)) {
          return { session: null, error: null };
        }
        return { session: null, error: new Error(error.message) };
      }
      return { session: data.session ?? null, error: null };
    } catch (err) {
      if (isTransientSupabaseFetchError(err)) {
        return { session: null, error: null };
      }
      throw err;
    }
  });
}

type UpdateUserData = Parameters<SupabaseClient["auth"]["updateUser"]>[0];

/** `updateUser()` — 응답 user 반환, 락 오류는 재throw */
export async function updateAuthUserSafe(
  supabase: SupabaseClient,
  attributes: UpdateUserData,
): Promise<{ user: User | null; error: Error | null }> {
  return serializeSupabaseAuth(async () => {
    const { data, error } = await supabase.auth.updateUser(attributes);
    return {
      user: data?.user ?? null,
      error: error ? new Error(error.message) : null,
    };
  });
}

"use client";

import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export type AuthSessionState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  supabaseConfigured: boolean;
};

/**
 * Supabase 브라우저 세션. 환경변수가 없으면 `loading`만 false이고 user는 항상 null.
 */
export function useAuthSession(): AuthSessionState {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const supabaseConfigured = useMemo(
    () =>
      Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL?.length &&
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
      ),
    [],
  );

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setUser(null);
      setSession(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    let subscription:
      | {
          unsubscribe: () => void;
        }
      | null = null;

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        const s = data.session;
        setSession(s);
        setUser(s?.user ?? null);
      } catch {
        if (cancelled) return;
        setSession(null);
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }

      // getSession() 로딩이 끝난 뒤에 구독을 시작해서,
      // 초기 이벤트가 user/session을 덮어쓰는 레이스를 줄입니다.
      if (cancelled) return;

      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange((_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
      });
      subscription = sub;
    };

    void init();

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  return {
    user,
    session,
    loading,
    supabaseConfigured,
  };
}

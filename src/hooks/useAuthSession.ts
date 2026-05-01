"use client";

import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import {
  buildSimulatedAuthUser,
  buildSimulatedSession,
  isAuthSimulateLoginEnabled,
} from "@/lib/authSimulate";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export type AuthSessionState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  supabaseConfigured: boolean;
};

const RECOVERY_COOKIE = "rm_recovery_in_progress";

function shouldMaskRecoverySession(): boolean {
  if (typeof window === "undefined") return false;
  const inRecovery = document.cookie
    .split(";")
    .map((v) => v.trim())
    .some((v) => v === `${RECOVERY_COOKIE}=1`);
  if (!inRecovery) return false;
  return !window.location.pathname.startsWith("/reset-password");
}

/**
 * Supabase 브라우저 세션. 환경변수가 없으면 `loading`만 false이고 user는 항상 null.
 * 로컬에서만: `.env.local`에 `NEXT_PUBLIC_DEV_AUTH_SIMULATE_LOGIN=1` → `authSimulate.ts`.
 */
export function useAuthSession(): AuthSessionState {
  const simEnabled = useMemo(() => isAuthSimulateLoginEnabled(), []);
  const simUserRef = useMemo(() => buildSimulatedAuthUser(), []);
  const simSessionRef = useMemo(() => buildSimulatedSession(simUserRef), [simUserRef]);

  const [user, setUser] = useState<User | null>(() => (simEnabled ? simUserRef : null));
  const [session, setSession] = useState<Session | null>(() => (simEnabled ? simSessionRef : null));
  const [loading, setLoading] = useState(() => !simEnabled);

  const supabaseConfigured = useMemo(
    () =>
      simEnabled ||
      Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL?.length &&
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
      ),
    [simEnabled],
  );

  useEffect(() => {
    if (simEnabled) {
      setUser(simUserRef);
      setSession(simSessionRef);
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setUser(null);
      setSession(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    // getSession()으로 실제 세션을 확인하기 전에는,
    // onAuthStateChange에서 먼저 들어오는 `null` 이벤트를 무시합니다.
    // (초기 레이스로 인해 user/session이 초기화되는 걸 방지)
    let resolved = false;
    let subscription:
      | {
          unsubscribe: () => void;
        }
      | null = null;

    const startAuthListener = () => {
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange((event, s) => {
        if (cancelled) return;

        if (shouldMaskRecoverySession()) {
          setSession(null);
          setUser(null);
          return;
        }

        if (s) {
          setSession(s);
          setUser(s.user ?? null);
          return;
        }

        // s === null 인 경우는 getSession()이 끝난 뒤에만 반영
        // (단, SIGNED_OUT은 명시적으로 반영)
        if (resolved || event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
        }
      });
      subscription = sub;
    };

    startAuthListener();

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        const s = data.session;
        resolved = true;
        if (shouldMaskRecoverySession()) {
          setSession(null);
          setUser(null);
          return;
        }
        setSession(s);
        setUser(s?.user ?? null);
      } catch {
        if (cancelled) return;
        resolved = true;
        setSession(null);
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void init();

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [simEnabled, simSessionRef, simUserRef]);

  return {
    user,
    session,
    loading,
    supabaseConfigured,
  };
}

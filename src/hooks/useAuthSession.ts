"use client";

import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import {
  buildSimulatedAuthUser,
  buildSimulatedSession,
  isAuthSimulateLoginEnabled,
} from "@/lib/authSimulate";
import { clearOAuthFlowPending, isOAuthFlowPending } from "@/lib/authOAuthPending";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { getAuthSessionSafe } from "@/lib/supabaseAuthSerialize";

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
 *
 * 시뮬 여부는 `useMemo([], …)`로 고정하지 않습니다. 예전에 켜 둔 번들/ Fast Refresh 이후에도
 * `.env.local`을 끈 값이 반영되도록 매 effect에서 `isAuthSimulateLoginEnabled()`를 다시 읽습니다.
 * (헤더에 로그인으로 보이는데 시뮬이 꺼져 있다면, 이전 구글 로그인의 실제 Supabase 쿠키입니다.)
 */
export function useAuthSession(): AuthSessionState {
  const simUserRef = useMemo(() => buildSimulatedAuthUser(), []);
  const simSessionRef = useMemo(() => buildSimulatedSession(simUserRef), [simUserRef]);

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const simOn = isAuthSimulateLoginEnabled();
  const supabaseConfigured =
    simOn ||
    Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL?.length &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
    );

  useEffect(() => {
    if (isAuthSimulateLoginEnabled()) {
      setUser(simUserRef);
      setSession(simSessionRef);
      setLoading(false);
      return;
    }

    setLoading(true);
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
          clearOAuthFlowPending();
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
        let s = (await getAuthSessionSafe(supabase)).session;
        if (!s && isOAuthFlowPending()) {
          for (let i = 0; i < 15 && !s; i++) {
            await new Promise((r) => setTimeout(r, 180));
            if (cancelled) return;
            s = (await getAuthSessionSafe(supabase)).session;
          }
        }
        if (cancelled) return;
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
        if (!cancelled) {
          clearOAuthFlowPending();
          setLoading(false);
        }
      }
    };

    void init();

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [simOn, simUserRef, simSessionRef]);

  return {
    user,
    session,
    loading,
    supabaseConfigured,
  };
}

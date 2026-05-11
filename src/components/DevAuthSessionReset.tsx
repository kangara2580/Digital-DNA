"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { isOAuthFlowPending } from "@/lib/authOAuthPending";

const OAUTH_RETURN_COOKIE = "dev_oauth_return";
/** 탭당 1회만 “시작 시 로그아웃” 적용 — 매 새로고침마다 `signOut` 하면 로그인 유지 테스트가 불가능 */
const DEV_START_SIGNED_OUT_ONCE_KEY = "digitaldna:dev-start-signed-out-applied";

function markDevStartSignedOutApplied() {
  try {
    sessionStorage.setItem(DEV_START_SIGNED_OUT_ONCE_KEY, "1");
  } catch {
    /* private mode / disabled storage */
  }
}

function consumeOAuthReturnCookie(): boolean {
  if (typeof document === "undefined") return false;
  const parts = document.cookie.split(";").map((c) => c.trim());
  const hit = parts.some((p) => p.startsWith(`${OAUTH_RETURN_COOKIE}=`));
  if (!hit) return false;
  document.cookie = `${OAUTH_RETURN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  return true;
}

/**
 * 개발 전용: 앱이 로드될 때 Supabase **로컬 세션(쿠키)** 을 한 번 비웁니다.
 * 예전에 구글 로그인해 둔 쿠키가 남아 “로그인 안 했는데 로그인된 것처럼” 보일 때 사용합니다.
 *
 * `.env.local` 에 `NEXT_PUBLIC_DEV_START_SIGNED_OUT=1` (및 `npm run dev`) 일 때만 동작합니다.
 * **같은 브라우저 탭에서는 한 번만** 세션을 비웁니다(`sessionStorage`). 새로고침마다 로그아웃되지 않습니다.
 * 구글 로그인 직후 `/auth/callback` → 앱으로 돌아올 때는 `dev_oauth_return` 쿠키로 **한 번 건너뜁니다.**
 *
 * OAuth 직후 첫 레이아웃에서는 리다이렉트로 받은 `dev_oauth_return` 이 `document.cookie`에
 * 아직 안 보이는 경우가 있어, `requestAnimationFrame` + `setTimeout(0)` 뒤에 다시 확인한 뒤에만 `signOut` 합니다.
 * 구글 OAuth를 막 시작한 직후(`sessionStorage` 플래그)에도 세션을 비우지 않습니다.
 */
export function DevAuthSessionReset() {
  const router = useRouter();
  const inFlightRef = useRef(false);

  useLayoutEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (process.env.NEXT_PUBLIC_DEV_START_SIGNED_OUT?.trim() !== "1") return;

    let cancelled = false;

    try {
      if (sessionStorage.getItem(DEV_START_SIGNED_OUT_ONCE_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    const shouldSkip = () =>
      cancelled || consumeOAuthReturnCookie() || isOAuthFlowPending();

    const runSignOut = () => {
      if (cancelled || inFlightRef.current) return;
      if (shouldSkip()) {
        markDevStartSignedOutApplied();
        return;
      }
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        markDevStartSignedOutApplied();
        return;
      }
      inFlightRef.current = true;
      void (async () => {
        try {
          await supabase.auth.signOut({ scope: "local" });
        } catch {
          /* ignore */
        } finally {
          inFlightRef.current = false;
          markDevStartSignedOutApplied();
          if (!cancelled) router.refresh();
        }
      })();
    };

    /** 동기 구간에서 쿠키가 안 보이는 경우 대비 — 한 틱·한 프레임 뒤 재확인 */
    const schedule = () => {
      if (shouldSkip()) {
        markDevStartSignedOutApplied();
        return;
      }
      requestAnimationFrame(() => {
        if (shouldSkip()) {
          markDevStartSignedOutApplied();
          return;
        }
        window.setTimeout(() => {
          if (shouldSkip()) {
            markDevStartSignedOutApplied();
            return;
          }
          runSignOut();
        }, 0);
      });
    };

    if (shouldSkip()) {
      markDevStartSignedOutApplied();
      return;
    }
    schedule();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}

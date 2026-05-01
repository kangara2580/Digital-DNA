"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuthSession } from "@/hooks/useAuthSession";
import { buildAuthCallbackRedirectTo } from "@/lib/authOAuthRedirect";
import { AuthModalGoogleStartButton } from "@/components/AuthModalGoogleStartButton";
import { LoggedInAccountHoverMenu } from "@/components/LoggedInAccountHoverMenu";
import { AuthModalPortal } from "@/components/AuthModalPortal";
import { topNavIconRingFullClass } from "@/lib/topNavIconRing";
import {
  authModalDialogSurface,
  authModalDismissButtonCls,
  authModalGlowBottom,
  authModalGlowTop,
} from "@/lib/authModalTheme";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type Props = {
  compact: boolean;
};

export function MainTopUserMenu({ compact }: Props) {
  const { user, loading } = useAuthSession();
  const [authOpen, setAuthOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [authOpen]);

  useEffect(() => {
    if (!authOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAuthOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authOpen]);

  const startGoogleAuth = useCallback(async () => {
    const next =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}${window.location.hash}`
        : "/";
    const redirectTo = buildAuthCallbackRedirectTo(next);
    const supabase = getSupabaseBrowserClient();
    if (supabase && redirectTo) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account" },
        },
      });
      if (!error && data.url) {
        window.location.assign(data.url);
        return;
      }
    }
    window.location.assign(`/api/auth/google/start?next=${encodeURIComponent(next)}`);
  }, []);

  if (loading) return null;

  if (!user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setAuthOpen(true)}
          className="relative inline-flex h-11 w-11 min-w-0 shrink-0 items-center justify-center rounded-full border border-white/40 bg-black/38 text-white/95 backdrop-blur-md transition-all duration-300 hover:bg-black/52"
          aria-haspopup="dialog"
          aria-expanded={authOpen}
          aria-label="로그인/회원가입 시작하기"
        >
          <span className="relative inline-flex h-6 w-6 items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              aria-hidden
            >
              <circle cx="12" cy="8" r="4" strokeWidth="2.2" />
              <path
                d="M4 20C4 15.8 7.6 12.4 12 12.4C16.4 12.4 20 15.8 20 20H4Z"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <svg
              viewBox="0 0 24 24"
              className="absolute -right-[0.28rem] -top-[0.28rem] h-3 w-3"
              fill="none"
              stroke="currentColor"
              aria-hidden
            >
              <path
                d="M12 4V20M4 12H20"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>

        {mounted && authOpen
          ? createPortal(
              <AuthModalPortal onDismiss={() => setAuthOpen(false)}>
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label="로그인 또는 회원가입"
                  className={`relative w-full max-h-[min(92vh,760px)] overflow-y-auto rounded-[24px] px-5 pb-8 pt-8 shadow-[0_60px_130px_-40px_rgba(0,0,0,0.95)] sm:rounded-[28px] sm:px-7 sm:pb-10 sm:pt-10 ${authModalDialogSurface}`}
                >
                  <div className={authModalGlowTop} aria-hidden />
                  <div className={authModalGlowBottom} aria-hidden />
                  <button
                    type="button"
                    onClick={() => setAuthOpen(false)}
                    className={authModalDismissButtonCls}
                    aria-label="닫기"
                  >
                    ×
                  </button>
                  <p className="relative text-center text-[clamp(1.85rem,6vw,2.65rem)] font-black tracking-tight text-white">
                    ARA
                  </p>
                  <p className="relative mt-3 text-center text-[clamp(1.15rem,4.6vw,1.85rem)] font-semibold leading-tight text-zinc-100">
                    로그인/회원가입
                  </p>
                  <AuthModalGoogleStartButton onClick={startGoogleAuth} />
                </div>
              </AuthModalPortal>,
              document.body,
            )
          : null}
      </>
    );
  }

  return (
    <LoggedInAccountHoverMenu
      triggerClassName={topNavIconRingFullClass(compact ? "compact" : "default")}
    >
      <svg
        viewBox="0 0 24 24"
        className={compact ? "h-4 w-4" : "h-[18px] w-[18px]"}
        fill="none"
        stroke="currentColor"
        aria-hidden
      >
        <circle cx="12" cy="8" r="4" strokeWidth="2.2" />
        <path
          d="M4 20C4 15.8 7.6 12.4 12 12.4C16.4 12.4 20 15.8 20 20H4Z"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </LoggedInAccountHoverMenu>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuthSession } from "@/hooks/useAuthSession";
import { buildAuthCallbackRedirectTo } from "@/lib/authOAuthRedirect";
import { AuthModalGoogleStartButton } from "@/components/AuthModalGoogleStartButton";
import {
  authModalBackdropBlurStrong,
  authModalDialogSurface,
  authModalGlowBottom,
  authModalGlowTop,
  authModalOverlayLayout,
} from "@/lib/authModalTheme";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type Props = {
  compact: boolean;
};

export function MainTopUserMenu({ compact }: Props) {
  const router = useRouter();
  const { user, loading } = useAuthSession();
  const [busy, setBusy] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const onLogout = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    try {
      await supabase.auth.signOut({ scope: "global" });
    } finally {
      setBusy(false);
    }
    router.replace("/login?logged_out=1");
    router.refresh();
  }, [router]);

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
              <div className={`${authModalOverlayLayout} ${authModalBackdropBlurStrong}`}>
                <button
                  type="button"
                  className="absolute inset-0"
                  aria-label="로그인 모달 닫기"
                  onClick={() => setAuthOpen(false)}
                />
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label="로그인 또는 회원가입"
                  className={`relative z-10 w-full max-w-[560px] max-h-[min(92vh,760px)] overflow-y-auto rounded-[24px] px-5 pb-8 pt-8 shadow-[0_60px_130px_-40px_rgba(0,0,0,0.95)] sm:rounded-[28px] sm:px-7 sm:pb-10 sm:pt-10 ${authModalDialogSurface}`}
                >
                  <div className={authModalGlowTop} aria-hidden />
                  <div className={authModalGlowBottom} aria-hidden />
                  <button
                    type="button"
                    onClick={() => setAuthOpen(false)}
                    className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-zinc-200 transition hover:bg-white/20"
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
              </div>,
              document.body,
            )
          : null}
      </>
    );
  }

  return (
    <div className="flex min-w-0 shrink-0 items-center gap-2">
      <Link
        href="/mypage"
        className={`inline-flex shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-zinc-100 shadow-[0_0_20px_-8px_rgba(0,242,234,0.35)] transition hover:border-[#00F2EA]/45 hover:bg-white/[0.12] [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-800 ${
          compact ? "h-8 w-8" : "h-9 w-9"
        }`}
        aria-label="마이페이지"
        title="마이페이지"
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
      </Link>
      <button
        type="button"
        onClick={() => void onLogout()}
        disabled={busy}
        className={`shrink-0 rounded-full border border-white/15 bg-white/[0.04] font-semibold tracking-tight text-zinc-300 transition hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-rose-100 disabled:opacity-50 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:border-rose-300 [html[data-theme='light']_&]:hover:bg-rose-50 [html[data-theme='light']_&]:hover:text-rose-800 ${
          compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1 text-[11px]"
        }`}
      >
        {busy ? "…" : "로그아웃"}
      </button>
    </div>
  );
}

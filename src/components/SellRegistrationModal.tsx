"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AuthModalGoogleStartButton } from "@/components/AuthModalGoogleStartButton";
import { ShopBagOutlineIcon } from "@/components/ShopBagOutlineIcon";
import { useAuthSession } from "@/hooks/useAuthSession";
import {
  araAuthDialogWordmarkClassName,
  araWordmarkFontStyle,
} from "@/lib/araBrandTypography";
import { buildAuthCallbackRedirectTo } from "@/lib/authOAuthRedirect";
import {
  authModalDialogSurface,
  authModalDismissButtonCls,
  authModalGlowBottom,
  authModalGlowTop,
  authModalScrimPaint,
} from "@/lib/authModalTheme";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useTranslation } from "@/hooks/useTranslation";

type Props = {
  open: boolean;
  onClose: () => void;
};

/** 레일·플로팅 UI보다 위 — 기존 모달과 동일 스택 */
const MODAL_Z = "z-[10060]";

export function SellRegistrationModal({ open, onClose }: Props) {
  const { t } = useTranslation();
  const { user, loading } = useAuthSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const startGoogleAuth = useCallback(async () => {
    const redirectTo = buildAuthCallbackRedirectTo("/sell");
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
    window.location.assign(`/api/auth/google/start?next=${encodeURIComponent("/sell")}`);
  }, []);

  if (!open || !mounted) return null;

  /** 비로그인: 메인 로그인 모달과 동일 — ARA · 로그인/회원가입 · Google CTA */
  /** 로그인 모달과 동일 — 반투명 스크림 + 그라데이션 카드 · 비로그인은 Google CTA, 로그인 후는 등록 방식 선택 */
  const portalShell = (dialog: ReactNode) =>
    createPortal(
      <>
        <div
          role="presentation"
          tabIndex={-1}
          className={`fixed inset-0 ${MODAL_Z} ${authModalScrimPaint}`}
          onClick={onClose}
          aria-hidden
        />
        <div
          className={`pointer-events-none fixed inset-0 ${MODAL_Z} flex items-center justify-center px-4`}
        >
          <div className="pointer-events-auto w-full max-w-[560px]">{dialog}</div>
        </div>
      </>,
      document.body,
    );

  if (!user) {
    return portalShell(
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("auth.dialogAria")}
        className={`relative w-full max-h-[min(92vh,760px)] overflow-y-auto rounded-[24px] px-5 pb-8 pt-8 shadow-[0_60px_130px_-40px_rgba(0,0,0,0.95)] sm:rounded-[28px] sm:px-7 sm:pb-10 sm:pt-10 ${authModalDialogSurface}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className={authModalGlowTop} aria-hidden />
        <div className={authModalGlowBottom} aria-hidden />
        <button
          type="button"
          onClick={onClose}
          className={authModalDismissButtonCls}
          aria-label={t("a11y.close")}
        >
          ×
        </button>
        <p className={araAuthDialogWordmarkClassName} style={araWordmarkFontStyle}>
          ARA
        </p>
        <p className="relative mt-3 text-center text-[clamp(1.15rem,4.6vw,1.85rem)] font-semibold leading-tight text-zinc-100">
          {t("auth.loginSignupTitle")}
        </p>
        {loading ? (
          <p className="relative mt-10 text-center text-[14px] font-medium text-zinc-400">
            {t("common.loading")}
          </p>
        ) : (
          <AuthModalGoogleStartButton onClick={() => void startGoogleAuth()} />
        )}
      </div>,
    );
  }

  return portalShell(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("sell.modalTitle")}
      className={`relative w-full max-h-[min(92vh,760px)] overflow-y-auto rounded-[24px] px-5 pb-8 pt-8 shadow-[0_60px_130px_-40px_rgba(0,0,0,0.95)] sm:rounded-[28px] sm:px-7 sm:pb-10 sm:pt-10 ${authModalDialogSurface}`}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className={authModalGlowTop} aria-hidden />
      <div className={authModalGlowBottom} aria-hidden />
      <button type="button" onClick={onClose} className={authModalDismissButtonCls} aria-label={t("a11y.close")}>
        ×
      </button>
      <div className="relative mt-1 flex items-center justify-center gap-2.5">
        <ShopBagOutlineIcon
          className="h-[clamp(1.45rem,5.1vw,2.1rem)] w-[clamp(1.45rem,5.1vw,2.1rem)] shrink-0 text-[color:var(--reels-point)]"
          strokeWidth={1.75}
        />
        <p className="text-center text-[clamp(1.15rem,4.6vw,1.85rem)] font-semibold leading-tight text-zinc-100">
          {t("sell.modalTitle")}
        </p>
      </div>
      <p className="relative mt-8 text-center text-[14px] font-medium text-zinc-400">
        {t("sell.chooseMethod")}
      </p>
      <div className="relative mt-6 flex w-full max-w-[31rem] mx-auto gap-1.5 rounded-[2.35rem] border border-white/[0.14] bg-white/[0.04] p-2.5 [html[data-theme='light']_&]:border-zinc-200/90 [html[data-theme='light']_&]:bg-zinc-100/60">
        <Link
          href="/sell?source=file"
          onClick={onClose}
          className="inline-flex min-h-[88px] flex-1 items-center justify-center rounded-[1.9rem] px-5 py-4 text-[clamp(1.125rem,3.8vw,1.375rem)] font-semibold leading-none text-zinc-100 transition-colors hover:bg-white/[0.08] hover:text-[color:var(--reels-point)] [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:bg-white/80 [html[data-theme='light']_&]:hover:text-[color:var(--reels-point)]"
        >
          {t("sell.methodFile")}
        </Link>
        <Link
          href="/sell?source=url"
          onClick={onClose}
          className="inline-flex min-h-[88px] flex-1 items-center justify-center rounded-[1.9rem] px-5 py-4 text-[clamp(1.125rem,3.8vw,1.375rem)] font-semibold leading-none text-zinc-100 transition-colors hover:bg-white/[0.08] hover:text-[color:var(--reels-point)] [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:bg-white/80 [html[data-theme='light']_&]:hover:text-[color:var(--reels-point)]"
        >
          {t("sell.methodUrl")}
        </Link>
      </div>
    </div>,
  );
}

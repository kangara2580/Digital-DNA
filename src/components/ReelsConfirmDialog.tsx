"use client";

import { createPortal } from "react-dom";
import { useEffect } from "react";
import { AuthModalPortal } from "@/components/AuthModalPortal";
import { useTranslation } from "@/hooks/useTranslation";
import {
  authModalDialogClipNoScroll,
  authModalDialogSurface,
  authModalGlowBottom,
  authModalGlowTop,
} from "@/lib/authModalTheme";

type Props = {
  open: boolean;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
  /** 확인(삭제 등) 진행 중 */
  confirmBusy?: boolean;
  dialogAriaLabel: string;
  title?: string;
};

/**
 * ARA 스타일 확인 다이얼로그 — `window.confirm` 대체용.
 * 다른 삭제·확인 플로우에도 재사용할 수 있습니다.
 */
export function ReelsConfirmDialog({
  open,
  message,
  cancelLabel,
  confirmLabel,
  onClose,
  onConfirm,
  confirmBusy = false,
  dialogAriaLabel,
  title,
}: Props) {
  const { t } = useTranslation();

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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !confirmBusy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, confirmBusy]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <AuthModalPortal onDismiss={confirmBusy ? () => {} : onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={dialogAriaLabel}
        className={`relative mx-auto w-full max-w-[min(100%,400px)] ${authModalDialogClipNoScroll} rounded-[24px] px-5 pb-6 pt-7 shadow-[0_60px_130px_-40px_rgba(0,0,0,0.95)] sm:rounded-[28px] sm:px-7 sm:pb-8 sm:pt-8 ${authModalDialogSurface}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className={authModalGlowTop} aria-hidden />
        <div className={authModalGlowBottom} aria-hidden />

        {title ? (
          <p className="relative z-[1] text-center text-[17px] font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            {title}
          </p>
        ) : null}

        <p
          className={`relative z-[1] text-center text-[15px] font-semibold leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-700 ${
            title ? "mt-3" : ""
          }`}
        >
          {message}
        </p>

        <div className="relative z-[1] mt-6 flex gap-2.5 sm:mt-7">
          <button
            type="button"
            disabled={confirmBusy}
            onClick={onClose}
            className="min-h-[46px] flex-1 rounded-full border border-white/20 bg-white/[0.06] px-4 py-2.5 text-[15px] font-bold text-zinc-200 transition hover:border-white/35 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:bg-zinc-200"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={confirmBusy}
            onClick={onConfirm}
            className="min-h-[46px] flex-1 rounded-full bg-[color:var(--reels-point)] px-4 py-2.5 text-[15px] font-extrabold text-white shadow-[0_12px_32px_-14px_rgba(255,45,141,0.55)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {confirmBusy ? t("common.loading") : confirmLabel}
          </button>
        </div>
      </div>
    </AuthModalPortal>,
    document.body,
  );
}

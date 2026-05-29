"use client";

import { createPortal } from "react-dom";
import { useEffect } from "react";
import { AuthModalGoogleStartButton } from "@/components/AuthModalGoogleStartButton";
import { AuthModalPortal } from "@/components/AuthModalPortal";
import {
  authModalDialogClipNoScroll,
  authModalDialogSurface,
  authModalDismissButtonCls,
  authModalGlowBottom,
  authModalGlowTop,
} from "@/lib/authModalTheme";
import { useTranslation } from "@/hooks/useTranslation";
import {
  araAuthDialogWordmarkClassName,
  araWordmarkFontStyle,
  authModalBrandHeadlineClassName,
} from "@/lib/araBrandTypography";

type Props = {
  open: boolean;
  onClose: () => void;
  onGoogleStart: () => void;
};

export function AuthPromptModal({ open, onClose, onGoogleStart }: Props) {
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
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <AuthModalPortal onDismiss={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("auth.dialogAria")}
        className={`relative mx-auto w-full max-w-[min(100%,560px)] ${authModalDialogClipNoScroll} rounded-[24px] px-5 pb-8 pt-8 shadow-[0_60px_130px_-40px_rgba(0,0,0,0.95)] sm:rounded-[28px] sm:px-7 sm:pb-10 sm:pt-10 ${authModalDialogSurface}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className={authModalGlowTop} aria-hidden />
        <div className={authModalGlowBottom} aria-hidden />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className={authModalDismissButtonCls}
          aria-label={t("a11y.close")}
        >
          ×
        </button>
        <p
          className={`${araAuthDialogWordmarkClassName} ${authModalBrandHeadlineClassName}`}
          style={araWordmarkFontStyle}
        >
          ARA
        </p>
        <p
          className={`relative mt-3 text-center text-[clamp(1.15rem,4.6vw,1.85rem)] font-semibold leading-tight text-zinc-100 ${authModalBrandHeadlineClassName}`}
        >
          {t("auth.loginSignupTitle")}
        </p>
        <AuthModalGoogleStartButton onClick={onGoogleStart} />
      </div>
    </AuthModalPortal>,
    document.body,
  );
}

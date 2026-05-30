"use client";

import { createPortal } from "react-dom";
import { useEffect } from "react";
import { AuthModalGoogleStartButton } from "@/components/AuthModalGoogleStartButton";
import { AuthModalPortal } from "@/components/AuthModalPortal";
import {
  authModalDialogClipNoScroll,
  authModalDialogFixedPaddingClass,
  authModalDialogFixedWidthClass,
  authModalDialogSurface,
  authModalDismissButtonFixedCls,
  authModalFixedSubtitleClass,
  authModalFixedWordmarkClass,
  authModalGlowBottom,
  authModalGlowTop,
} from "@/lib/authModalTheme";
import { useTranslation } from "@/hooks/useTranslation";
import {
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
        className={`relative ${authModalDialogFixedWidthClass} ${authModalDialogFixedPaddingClass} ${authModalDialogClipNoScroll} shadow-[0_60px_130px_-40px_rgba(0,0,0,0.95)] ${authModalDialogSurface}`}
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
          className={authModalDismissButtonFixedCls}
          aria-label={t("a11y.close")}
        >
          ×
        </button>
        <p
          className={`${authModalFixedWordmarkClass} ${authModalBrandHeadlineClassName}`}
          style={araWordmarkFontStyle}
        >
          ARA
        </p>
        <p
          className={`${authModalFixedSubtitleClass} ${authModalBrandHeadlineClassName}`}
        >
          {t("auth.loginSignupTitle")}
        </p>
        <AuthModalGoogleStartButton onClick={onGoogleStart} />
      </div>
    </AuthModalPortal>,
    document.body,
  );
}

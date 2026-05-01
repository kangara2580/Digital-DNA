"use client";

import { createPortal } from "react-dom";
import { AuthModalGoogleStartButton } from "@/components/AuthModalGoogleStartButton";
import { AuthModalPortal } from "@/components/AuthModalPortal";
import {
  authModalDialogSurface,
  authModalDismissButtonCls,
  authModalGlowBottom,
  authModalGlowTop,
} from "@/lib/authModalTheme";

type Props = {
  open: boolean;
  onClose: () => void;
  onGoogleStart: () => void;
};

export function AuthPromptModal({ open, onClose, onGoogleStart }: Props) {
  if (!open) return null;

  return createPortal(
    <AuthModalPortal onDismiss={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="로그인 또는 회원가입"
        className={`relative w-full rounded-[24px] px-5 pb-8 pt-8 shadow-[0_60px_130px_-40px_rgba(0,0,0,0.95)] sm:rounded-[28px] sm:px-7 sm:pb-10 sm:pt-10 ${authModalDialogSurface}`}
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
        <AuthModalGoogleStartButton onClick={onGoogleStart} />
      </div>
    </AuthModalPortal>,
    document.body,
  );
}

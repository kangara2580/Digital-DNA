"use client";

import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  onGoogleStart: () => void;
};

export function AuthPromptModal({ open, onClose, onGoogleStart }: Props) {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/70 px-4 backdrop-blur-[6px]"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="absolute inset-0"
        aria-label="로그인 모달 닫기"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="로그인 또는 회원가입"
        className="relative z-10 w-full max-w-[560px] rounded-[24px] border border-white/20 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(0,51,255,0.34)_0%,rgba(8,14,30,0.94)_52%,rgba(2,6,16,0.98)_100%)] px-5 pb-8 pt-8 shadow-[0_60px_130px_-40px_rgba(0,0,0,0.95)] sm:rounded-[28px] sm:px-7 sm:pb-10 sm:pt-10"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
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
        <button
          type="button"
          onClick={onGoogleStart}
          className="relative mx-auto mt-9 flex w-full max-w-[360px] items-center justify-center gap-3 rounded-full bg-white px-4 py-3 text-[clamp(1.0625rem,3.9vw,1.3125rem)] font-extrabold text-[#1a1a1a] shadow-[0_16px_34px_-18px_rgba(255,255,255,0.95)] transition hover:brightness-95 sm:px-6 sm:py-4"
        >
          <svg className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#EA4335"
              d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.3-1.9 3l3 2.3c1.7-1.6 2.7-3.9 2.7-6.7 0-.6-.1-1.2-.2-1.8H12z"
            />
            <path
              fill="#34A853"
              d="M12 22c2.4 0 4.4-.8 5.9-2.2l-3-2.3c-.8.6-1.8 1-2.9 1-2.2 0-4.1-1.5-4.7-3.5l-3.1 2.4C5.6 20.3 8.6 22 12 22z"
            />
            <path
              fill="#4A90E2"
              d="M7.3 15c-.2-.6-.4-1.3-.4-2s.1-1.4.4-2L4.2 8.6C3.4 10.1 3 11.5 3 13s.4 2.9 1.2 4.4L7.3 15z"
            />
            <path
              fill="#FBBC05"
              d="M12 7.5c1.3 0 2.5.4 3.4 1.3l2.6-2.6C16.4 4.7 14.4 4 12 4 8.6 4 5.6 5.7 4.2 8.6L7.3 11c.6-2 2.5-3.5 4.7-3.5z"
            />
          </svg>
          Google로 바로 시작
        </button>
      </div>
    </div>,
    document.body,
  );
}

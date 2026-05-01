"use client";

import { ChevronRight } from "lucide-react";
import {
  authModalGoogleButtonShadow,
  authModalGoogleButtonText,
} from "@/lib/authModalTheme";

type Props = {
  onClick: () => void | Promise<void>;
};

const googleGlyph = (
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
);

/** 로그인·회원가입 모달 공통 — Google CTA (브랜드 핑크 화살표) */
export function AuthModalGoogleStartButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative mx-auto mt-9 flex w-full max-w-[360px] items-center justify-center gap-2.5 rounded-full bg-white px-4 py-3 font-extrabold text-[#1a1a1a] transition hover:brightness-95 sm:gap-3 sm:px-6 sm:py-4 ${authModalGoogleButtonText} ${authModalGoogleButtonShadow}`}
    >
      {googleGlyph}
      <span className="shrink-0">Google로 바로 시작</span>
      <ChevronRight
        className="h-[1.12em] w-[1.12em] shrink-0 text-[color:var(--reels-point)] sm:h-[1.18em] sm:w-[1.18em]"
        strokeWidth={2.75}
        aria-hidden
      />
    </button>
  );
}

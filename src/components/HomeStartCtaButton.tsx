"use client";

import type { ButtonHTMLAttributes } from "react";

const BRAND_PINK = "#fc03a5";

export type HomeStartCtaButtonProps = {
  onClick: NonNullable<ButtonHTMLAttributes<HTMLButtonElement>["onClick"]>;
  disabled?: boolean;
  onPointerDown?: ButtonHTMLAttributes<HTMLButtonElement>["onPointerDown"];
};

/**
 * 참고 UI: 흰 pill + gray-200 테두리 + 오른쪽 브랜드 핑크 스쿼클 + 흰 화살표.
 */
export function HomeStartCtaButton({
  onClick,
  disabled,
  onPointerDown,
}: HomeStartCtaButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      disabled={disabled}
      className="group inline-flex shrink-0 items-center rounded-full border border-zinc-200 bg-white py-1.5 pl-[clamp(1.3rem,3.5vw,1.9rem)] pr-3 shadow-[0_2px_14px_-3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.04)] transition-[border-color,background-color,box-shadow] duration-200 hover:border-zinc-300 hover:bg-zinc-50/90 hover:shadow-[0_4px_18px_-4px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.05)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400/70 disabled:cursor-not-allowed disabled:opacity-50 sm:pr-3.5"
    >
      <span className="min-w-0 pr-3 text-left text-[16px] font-bold tracking-[-0.015em] text-zinc-800 sm:pr-3.5 sm:text-[17px]">
        시작하기
      </span>
      <span
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11"
        style={{
          backgroundColor: BRAND_PINK,
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.26), inset 0 -2px 6px rgba(0,0,0,0.14)",
        }}
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className="h-5 w-5 shrink-0 text-white sm:h-6 sm:w-6"
          stroke="currentColor"
          strokeWidth="1.95"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M4 10h12M12 4l6 6-6 6" />
        </svg>
      </span>
    </button>
  );
}

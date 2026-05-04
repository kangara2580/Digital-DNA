"use client";

import type { ButtonHTMLAttributes } from "react";

/**
 * 홈·하이라이트 공통 시작 CTA — 옅은 검정 필 + 1px 반투명 화이트 테두리,
 * 호버 시 동일 두께로 브랜드 핑크 테두리.
 */
export type HomeStartCtaButtonProps = {
  onClick: NonNullable<ButtonHTMLAttributes<HTMLButtonElement>["onClick"]>;
  disabled?: boolean;
  onPointerDown?: ButtonHTMLAttributes<HTMLButtonElement>["onPointerDown"];
  /** 홈 히어로 등: 세로·글자만 살짝 줄임 */
  compactSpacing?: boolean;
};

export function HomeStartCtaButton({
  onClick,
  disabled,
  onPointerDown,
  compactSpacing = false,
}: HomeStartCtaButtonProps) {
  const sizeCls = compactSpacing
    ? "px-6 py-2.5 text-[16px] sm:px-7 sm:py-3 sm:text-[17px]"
    : "px-7 py-3.5 text-[17px] sm:px-9 sm:py-4 sm:text-[19px]";

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      disabled={disabled}
      className={`group inline-flex shrink-0 cursor-pointer items-center justify-center gap-2.5 rounded-full border border-white/38 bg-black/25 ${sizeCls} font-semibold tracking-[-0.02em] text-white transition-[box-shadow,background-color,border-color] duration-300 ease-out hover:border-[rgba(228,41,128,0.58)] hover:bg-black/38 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reels-crimson/45 focus-visible:ring-offset-0 [html[data-theme='light']_&]:border-white/45 [html[data-theme='light']_&]:bg-black/15 [html[data-theme='light']_&]:hover:border-[rgba(228,41,128,0.52)] [html[data-theme='light']_&]:hover:bg-black/28 [html[data-theme='light']_&]:hover:shadow-[0_6px_20px_-10px_rgba(0,0,0,0.28)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-white/38 disabled:hover:bg-black/25 disabled:hover:shadow-none disabled:[html[data-theme='light']_&]:hover:border-white/45 disabled:[html[data-theme='light']_&]:hover:bg-black/15`}
    >
      <span className="select-none text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]">
        시작하기
      </span>
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="h-[1.15em] w-[1.15em] shrink-0 origin-left text-reels-crimson will-change-transform motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:scale-x-100 transition-[transform] duration-500 ease-[cubic-bezier(0.33,1.45,0.58,1)] group-hover:translate-x-2 group-hover:scale-x-[1.14] sm:group-hover:translate-x-2.5 sm:group-hover:scale-x-[1.18]"
        stroke="currentColor"
        strokeWidth={2.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M6.5 5 14 10 6.5 15" />
      </svg>
    </button>
  );
}

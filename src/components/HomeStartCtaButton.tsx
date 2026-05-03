"use client";

import type { ButtonHTMLAttributes } from "react";

export type HomeStartCtaButtonProps = {
  onClick: NonNullable<ButtonHTMLAttributes<HTMLButtonElement>["onClick"]>;
  disabled?: boolean;
  onPointerDown?: ButtonHTMLAttributes<HTMLButtonElement>["onPointerDown"];
};

/** 메인「시작하기」— 브랜드 핑크 그라데이션 테두리 + 글로우(히어로·푸터 공통) */
export function HomeStartCtaButton({
  onClick,
  disabled,
  onPointerDown,
}: HomeStartCtaButtonProps) {
  return (
    <span
      className="inline-flex shrink-0 rounded-full p-[2px] shadow-[0_0_26px_-3px_rgba(252,3,165,0.55),0_8px_32px_-8px_rgba(252,3,165,0.38)]"
      style={{
        background:
          "linear-gradient(128deg, #ffe8fa 0%, #ff7fd0 22%, #fc03a5 48%, #c80070 76%, #620036 100%)",
      }}
    >
      <button
        type="button"
        onClick={onClick}
        onPointerDown={onPointerDown}
        disabled={disabled}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-black px-[clamp(2rem,5.2vw,3.75rem)] py-[clamp(0.45rem,0.8vw,0.66rem)] text-[clamp(calc(1.2rem-2pt),calc(2.1vw-2pt),calc(1.9rem-2pt))] font-semibold text-[#ffffff] transition-opacity duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fc03a5]/65 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-950 [html[data-theme='light']_&]:focus-visible:outline-zinc-400/50 disabled:cursor-not-allowed disabled:opacity-55"
      >
        시작하기
      </button>
    </span>
  );
}

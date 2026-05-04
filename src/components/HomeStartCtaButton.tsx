"use client";

import type { ButtonHTMLAttributes } from "react";

export type HomeStartCtaButtonProps = {
  onClick: NonNullable<ButtonHTMLAttributes<HTMLButtonElement>["onClick"]>;
  disabled?: boolean;
  onPointerDown?: ButtonHTMLAttributes<HTMLButtonElement>["onPointerDown"];
};

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
      className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-white/40 bg-transparent px-[clamp(2rem,5.2vw,3.75rem)] py-[clamp(0.45rem,0.8vw,0.66rem)] text-[clamp(calc(1.2rem-2pt),calc(2.1vw-2pt),calc(1.9rem-2pt))] font-semibold text-white transition-colors duration-200 hover:border-white/70 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50 disabled:cursor-not-allowed disabled:opacity-50 [html[data-theme='light']_&]:border-zinc-400 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:border-zinc-600 [html[data-theme='light']_&]:hover:bg-zinc-100/60"
    >
      시작하기
    </button>
  );
}

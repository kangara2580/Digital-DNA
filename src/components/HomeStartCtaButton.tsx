"use client";

import type { ButtonHTMLAttributes, CSSProperties } from "react";

export type HomeStartCtaButtonProps = {
  onClick: NonNullable<ButtonHTMLAttributes<HTMLButtonElement>["onClick"]>;
  disabled?: boolean;
  onPointerDown?: ButtonHTMLAttributes<HTMLButtonElement>["onPointerDown"];
};

/**
 * 메인「시작하기」— 리퀴드 글래스 캡슐: 좌 흑 → 우 브랜드 핑크,
 * 상·측·하 반사층 + 좌 암부 / 우 핑크 이중 드롭 섀도.
 */
export function HomeStartCtaButton({
  onClick,
  disabled,
  onPointerDown,
}: HomeStartCtaButtonProps) {
  const outerFilter: CSSProperties = {
    filter: [
      "drop-shadow(-8px 12px 14px rgba(0, 0, 0, 0.52))",
      "drop-shadow(-4px 22px 32px rgba(0, 0, 0, 0.4))",
      "drop-shadow(10px 14px 20px rgba(252, 3, 165, 0.5))",
      "drop-shadow(4px 24px 40px rgba(252, 3, 165, 0.38))",
      "drop-shadow(0 8px 18px rgba(0, 0, 0, 0.32))",
    ].join(" "),
  };

  const bodyStyle: CSSProperties = {
    background:
      "linear-gradient(90deg, #000000 0%, #050205 11%, #120910 26%, #240f1a 40%, #3c0f2a 52%, #5c0e40 63%, #840853 73%, #b1046a 82%, #e00383 91%, #fc03a5 100%)",
    boxShadow: `
      inset 0 2px 5px rgba(255, 255, 255, 0.42),
      inset 0 -4px 14px rgba(0, 0, 0, 0.48),
      inset 0 0 42px rgba(252, 3, 165, 0.16),
      0 0 0 1px rgba(255, 255, 255, 0.11)
    `.replace(/\s+/g, " "),
  };

  return (
    <span
      className="relative inline-flex shrink-0 [html[data-theme='light']_&]:contrast-[1.02]"
      style={outerFilter}
    >
      <button
        type="button"
        onClick={onClick}
        onPointerDown={onPointerDown}
        disabled={disabled}
        style={bodyStyle}
        className="relative isolate inline-flex min-h-0 min-w-0 items-center justify-center overflow-hidden whitespace-nowrap rounded-full px-[clamp(2rem,5.2vw,3.75rem)] py-[clamp(0.45rem,0.8vw,0.66rem)] font-semibold transition-opacity duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/35 disabled:cursor-not-allowed disabled:opacity-45 [html[data-theme='light']_&]:focus-visible:outline-zinc-400/45"
      >
        {/* 살짝 어두운 코어(두께감) */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(ellipse_92%_78%_at_50%_48%,rgba(0,0,0,0.22)_0%,transparent_55%)] opacity-80"
        />

        {/* 상단 큰 글래스 하이라이트(호 형태) */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-[6%] top-0 z-[1] h-[42%] rounded-t-[9999px] bg-gradient-to-b from-white/75 from-[8%] via-white/22 to-transparent [html[data-theme='light']_&]:from-white/62 [html[data-theme='light']_&]:via-white/16"
        />

        {/* 상단 날카로운 스펙큘러 띠 */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-[9%] right-[9%] top-[2px] z-[2] h-[2px] rounded-full bg-gradient-to-r from-transparent via-white/95 to-transparent opacity-90 [html[data-theme='light']_&]:opacity-85"
          style={{ filter: "blur(0.45px)" }}
        />

        {/* 좌(검정 쪽) 측면 유리 재질 반사 */}
        <span
          aria-hidden
          className="pointer-events-none absolute -left-[2%] top-[16%] z-[1] h-[60%] w-[32%] rounded-full bg-gradient-to-r from-white/24 via-white/6 to-transparent opacity-85"
          style={{ filter: "blur(1px)" }}
        />

        {/* 우(핑크 쪽) 강한 측면 하이라이트 */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-[4%] top-[12%] z-[1] h-[62%] w-[46%] rounded-full bg-gradient-to-l from-white/52 from-[18%] via-white/14 to-transparent opacity-90"
          style={{ filter: "blur(1.6px)" }}
        />

        {/* 하단 ‘바닥 반사’ 코스틱 */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-[4%] bottom-0 z-[1] h-[26%] rounded-b-[9999px] bg-gradient-to-t from-white/32 from-[6%] via-white/12 to-transparent [html[data-theme='light']_&]:from-white/26"
        />

        {/* 좌·우 끝단 볼록면 하이라이트 */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-[1%] top-1/2 z-[1] h-[46%] w-[7%] -translate-y-1/2 rounded-full bg-gradient-to-r from-white/38 to-transparent opacity-55"
          style={{ filter: "blur(1.2px)" }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-[1%] top-1/2 z-[1] h-[50%] w-[9%] -translate-y-1/2 rounded-full bg-gradient-to-l from-white/45 to-transparent opacity-60"
          style={{ filter: "blur(1px)" }}
        />

        {/* 얕은 이차 스펙큘러(유체 느낌) */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-[18%] right-[38%] top-[14%] z-[3] h-px rounded-full bg-gradient-to-r from-transparent via-white/55 to-transparent opacity-70"
        />

        <span
          className="relative z-10 select-none text-[clamp(calc(1.2rem-2pt),calc(2.1vw-2pt),calc(1.9rem-2pt))] font-semibold tracking-[0.01em] text-[#faf6f0]"
          style={{
            textShadow:
              "0 1px 2px rgba(0,0,0,0.55), 0 -1px 1px rgba(255,255,255,0.14), 0 0 20px rgba(252,3,165,0.12)",
          }}
        >
          시작하기
        </span>
      </button>
    </span>
  );
}

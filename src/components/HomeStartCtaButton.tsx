"use client";

import type { ButtonHTMLAttributes, CSSProperties } from "react";

export type HomeStartCtaButtonProps = {
  onClick: NonNullable<ButtonHTMLAttributes<HTMLButtonElement>["onClick"]>;
  disabled?: boolean;
  onPointerDown?: ButtonHTMLAttributes<HTMLButtonElement>["onPointerDown"];
};

/**
 * 메인「시작하기」— 유리(글래스) 캡슐: 흑→핑크 본체,
 * 다층 부드러운 상면 반사 + 측면/하부 굴절광, 네온 없는 자연 암부 섀도.
 */
export function HomeStartCtaButton({
  onClick,
  disabled,
  onPointerDown,
}: HomeStartCtaButtonProps) {
  /** 접지용: 짙은 중성 섀도만(핑크 발광 제거) */
  const outerFilter: CSSProperties = {
    filter: [
      "drop-shadow(0 1px 1px rgba(0, 0, 0, 0.65))",
      "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.42))",
      "drop-shadow(0 10px 20px rgba(0, 0, 0, 0.32))",
      "drop-shadow(0 18px 36px rgba(0, 0, 0, 0.22))",
      "drop-shadow(0 28px 56px rgba(0, 0, 0, 0.12))",
    ].join(" "),
  };

  const bodyStyle: CSSProperties = {
    background:
      "linear-gradient(90deg, #000000 0%, #060206 11%, #130a10 26%, #260e1b 40%, #3e0f2b 52%, #5e0d3f 63%, #860a52 73%, #b2086a 82%, #e00582 91%, #fc03a5 100%)",
    boxShadow: `
      inset 0 1px 1px rgba(255, 255, 255, 0.48),
      inset 0 2px 6px rgba(255, 255, 255, 0.12),
      inset 0 -2px 4px rgba(0, 0, 0, 0.35),
      inset 0 -14px 28px rgba(255, 255, 255, 0.075),
      inset 0 0 1px rgba(255, 255, 255, 0.09)
    `.replace(/\s+/g, " "),
  };

  return (
    <span
      className="relative inline-flex shrink-0"
      style={outerFilter}
    >
      <button
        type="button"
        onClick={onClick}
        onPointerDown={onPointerDown}
        disabled={disabled}
        style={bodyStyle}
        className="relative isolate inline-flex min-h-0 min-w-0 items-center justify-center overflow-hidden whitespace-nowrap rounded-full px-[clamp(2rem,5.2vw,3.75rem)] py-[clamp(0.45rem,0.8vw,0.66rem)] font-semibold transition-opacity duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30 disabled:cursor-not-allowed disabled:opacity-45 [html[data-theme='light']_&]:focus-visible:outline-zinc-400/45"
      >
        {/* 유리 벽 두께: 가장자리만 살짝 어둡게 */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(ellipse_100%_92%_at_50%_45%,transparent_38%,rgba(0,0,0,0.14)_88%,rgba(0,0,0,0.22)_100%)] opacity-[0.85]"
        />

        {/* 주 상면: 넓은 타원 — 중앙이 가장 밝고 좌우로 부드럽게 소멸 */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[52%] rounded-t-[9999px] bg-[radial-gradient(ellipse_118%_95%_at_50%_-12%,rgba(255,255,255,0.42)_0%,rgba(255,255,255,0.16)_32%,rgba(255,255,255,0.04)_58%,transparent_78%)] [html[data-theme='light']_&]:opacity-95"
        />

        {/* 보조 상면: 비대칭 작은 하이라이트(한 덩어리 광 탈피) */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-[8%] top-0 z-[1] h-[38%] w-[42%] rounded-t-[9999px] bg-[radial-gradient(ellipse_90%_100%_at_30%_-18%,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.06)_45%,transparent_72%)] opacity-90 mix-blend-soft-light"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-[6%] top-0 z-[1] h-[36%] w-[48%] rounded-t-[9999px] bg-[radial-gradient(ellipse_88%_100%_at_72%_-10%,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0.07)_48%,transparent_76%)] opacity-[0.78] mix-blend-soft-light"
        />

        {/* 상연 스펙큘러: 얇고 길게 — 끝으로 갈수록 흐려짐 */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-[14%] right-[14%] top-[1px] z-[2] h-[1.5px] rounded-full bg-gradient-to-r from-transparent via-white/90 to-transparent opacity-80 [html[data-theme='light']_&]:opacity-75"
          style={{ filter: "blur(0.35px)" }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-[22%] right-[32%] top-[5px] z-[2] h-px rounded-full bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-60"
          style={{ filter: "blur(0.6px)" }}
        />

        {/* 볼록한 중앙대: 아주 옅은 수평 띠(유리 면 한 가운데 부드러운 반사) */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-[10%] right-[10%] top-[36%] z-[1] h-[10%] rounded-full bg-gradient-to-b from-white/[0.11] via-white/[0.04] to-transparent opacity-70 blur-[2px]"
        />

        {/* 좌·우 측면: 채도 따라 다른 반사 강도 */}
        <span
          aria-hidden
          className="pointer-events-none absolute -left-[1%] top-[22%] z-[1] h-[56%] w-[28%] rounded-full bg-gradient-to-r from-white/16 via-white/[0.05] to-transparent opacity-80"
          style={{ filter: "blur(1.1px)" }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-[2%] top-[18%] z-[1] h-[58%] w-[38%] rounded-full bg-gradient-to-l from-white/34 from-[15%] via-white/[0.08] to-transparent opacity-85"
          style={{ filter: "blur(1.4px)" }}
        />

        {/* 하부 내면: 빛이 모이는 느낌(좌 약한 웜 / 우 핑크 기운 살짝) */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-[5%] bottom-0 z-[1] h-[30%] rounded-b-[9999px] bg-gradient-to-t from-white/22 from-[5%] via-white/[0.08] to-transparent opacity-[0.88]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-[8%] -bottom-[8%] z-[1] h-[36%] rounded-b-[9999px] bg-[radial-gradient(ellipse_125%_75%_at_50%_105%,rgba(255,250,245,0.1)_0%,rgba(252,3,165,0.08)_55%,transparent_70%)] opacity-70 mix-blend-soft-light [html[data-theme='light']_&]:opacity-55"
        />

        {/* 캡슐 양끝 얇은 광택 */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-[0.5%] top-1/2 z-[1] h-[44%] w-[6%] -translate-y-1/2 rounded-full bg-gradient-to-r from-white/28 to-transparent opacity-50"
          style={{ filter: "blur(1px)" }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-[0.5%] top-1/2 z-[1] h-[48%] w-[7.5%] -translate-y-1/2 rounded-full bg-gradient-to-l from-white/32 to-transparent opacity-52"
          style={{ filter: "blur(0.9px)" }}
        />

        <span
          className="relative z-10 select-none text-[clamp(calc(1.2rem-2pt),calc(2.1vw-2pt),calc(1.9rem-2pt))] font-semibold tracking-[0.01em] text-[#faf6f0]"
          style={{
            textShadow:
              "0 1px 3px rgba(0,0,0,0.55), 0 0 1px rgba(0,0,0,0.35)",
          }}
        >
          시작하기
        </span>
      </button>
    </span>
  );
}

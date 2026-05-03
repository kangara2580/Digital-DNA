"use client";

import type { ButtonHTMLAttributes, CSSProperties } from "react";

export type HomeStartCtaButtonProps = {
  onClick: NonNullable<ButtonHTMLAttributes<HTMLButtonElement>["onClick"]>;
  disabled?: boolean;
  onPointerDown?: ButtonHTMLAttributes<HTMLButtonElement>["onPointerDown"];
};

/**
 * 리퀴드 글래스 캡슐 — 오메가3 알약처럼 안이 비치고 입체적으로 빛나는 버튼.
 * 흑(좌) → 브랜드 핑크(우) 기반, 12개 광학 레이어.
 *
 * 레이어 순서 (아래부터):
 * L0  body: 본체 좌흑→우핑크 그라데이션 + inset 기본 입체
 * L1  rim-shadow: 가장자리 어두운 테두리(유리 두께)
 * L2  inner-core-haze: 중앙 유리 내부 굴절 헤이즈(약한 밝기)
 * L3  surface-dome: 상단 반구형 넓은 글래스 돔
 * L4  specular-arc: 상연 스펙큘러 곡선 — 좌에서 우로 밝아짐
 * L5  specular-hot: 최상단 얇은 핫라인
 * L6  left-rim-light: 좌 캡슐 끝 흰빛
 * L7  right-corona: 우 핑크 코로나(측면 반사)
 * L8  right-rim-hot: 우 캡슐 끝 흰 스펙큘러
 * L9  bottom-caustic: 하단 바닥 반사 코스틱
 * L10 bottom-rim: 하연 얇은 반사 테두리
 * L11 text
 */
export function HomeStartCtaButton({
  onClick,
  disabled,
  onPointerDown,
}: HomeStartCtaButtonProps) {
  /* ── 바깥 래퍼: 입체 그림자만, 핑크 글로우 없음 ── */
  const wrapShadow: CSSProperties = {
    filter: [
      "drop-shadow(0 2px  3px rgba(0,0,0,0.70))",
      "drop-shadow(0 5px  8px rgba(0,0,0,0.50))",
      "drop-shadow(0 12px 20px rgba(0,0,0,0.36))",
      "drop-shadow(0 22px 36px rgba(0,0,0,0.24))",
      "drop-shadow(0 34px 52px rgba(0,0,0,0.14))",
    ].join(" "),
  };

  /* ── L0 본체: 좌흑 → 우핑크 ── */
  const bodyStyle: CSSProperties = {
    background:
      "linear-gradient(100deg," +
      "#000000  0%," +
      "#040204  7%," +
      "#0f0510 16%," +
      "#1e0a18 26%," +
      "#330c26 36%," +
      "#4e0c38 46%," +
      "#6e0a4c 55%," +
      "#930960 64%," +
      "#bb076f 73%," +
      "#df057f 82%," +
      "#f90295 91%," +
      "#fc03a5 100%)",
    /* inset: 상단 밝은 1px 테두리 + 하단 어둠 + 얕은 내부 렌즈 */
    boxShadow: [
      "inset 0  1px  2px rgba(255,255,255,0.62)",   /* 상단 림라이트 */
      "inset 0  2px  8px rgba(255,255,255,0.18)",   /* 상단 확산 */
      "inset 0 -1px  1px rgba(255,255,255,0.35)",   /* 하단 림라이트 */
      "inset 0 -3px 10px rgba(0,0,0,0.40)",         /* 하단 어둠 */
      "inset 0  0   1px rgba(255,255,255,0.12)",    /* 전체 미세 하이라이트 */
    ].join(","),
  };

  return (
    <span
      className="relative inline-flex shrink-0"
      style={wrapShadow}
    >
      <button
        type="button"
        onClick={onClick}
        onPointerDown={onPointerDown}
        disabled={disabled}
        style={bodyStyle}
        className={[
          "relative isolate",
          "inline-flex min-h-0 min-w-0 items-center justify-center",
          "overflow-hidden whitespace-nowrap rounded-full",
          "px-[clamp(2rem,5.2vw,3.75rem)] py-[clamp(0.45rem,0.8vw,0.66rem)]",
          "font-semibold",
          "transition-opacity duration-200 ease-out",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30",
          "disabled:cursor-not-allowed disabled:opacity-45",
        ].join(" ")}
      >

        {/* ── L1 rim-shadow: 가장자리 어두운 유리 두께 ── */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse 100% 92% at 50% 45%," +
              "  transparent 42%," +
              "  rgba(0,0,0,0.12) 68%," +
              "  rgba(0,0,0,0.28) 88%," +
              "  rgba(0,0,0,0.40) 100%)",
          }}
        />

        {/* ── L2 inner-core-haze: 중앙 내부 굴절 (안이 비치는 느낌) ── */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse 76% 52% at 54% 52%," +
              "  rgba(255,255,255,0.055) 0%," +
              "  rgba(255,255,255,0.022) 44%," +
              "  transparent 72%)",
            mixBlendMode: "screen",
          }}
        />

        {/* ── L3 surface-dome: 상단 반구형 넓은 글래스 돔 ── */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 rounded-t-[9999px]"
          style={{
            height: "58%",
            background:
              "radial-gradient(ellipse 105% 100% at 50% -5%," +
              "  rgba(255,255,255,0.48)  0%," +
              "  rgba(255,255,255,0.24) 24%," +
              "  rgba(255,255,255,0.08) 48%," +
              "  rgba(255,255,255,0.02) 64%," +
              "  transparent            80%)",
          }}
        />

        {/* ── L3b dome 비대칭 보정: 왼쪽 위 더 밝게 ── */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 rounded-t-[9999px]"
          style={{
            left: "4%", width: "38%", height: "48%",
            background:
              "radial-gradient(ellipse 100% 100% at 22% -10%," +
              "  rgba(255,255,255,0.26) 0%," +
              "  rgba(255,255,255,0.08) 42%," +
              "  transparent 68%)",
            mixBlendMode: "soft-light",
          }}
        />

        {/* ── L4 specular-arc: 상연 스펙큘러 곡선 ── */}
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            top: "1.5px",
            left: "8%", right: "8%",
            height: "2px",
            background:
              "linear-gradient(90deg," +
              "  transparent 0%," +
              "  rgba(255,255,255,0.55) 18%," +
              "  rgba(255,255,255,0.92) 44%," +
              "  rgba(255,255,255,0.88) 62%," +
              "  rgba(255,255,255,0.55) 80%," +
              "  transparent 100%)",
            filter: "blur(0.5px)",
          }}
        />

        {/* ── L5 specular-hot: 최상단 극세선 (유리 능선) ── */}
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            top: "0px",
            left: "16%", right: "16%",
            height: "1px",
            background:
              "linear-gradient(90deg," +
              "  transparent 0%," +
              "  rgba(255,255,255,0.80) 30%," +
              "  rgba(255,255,255,1.00) 50%," +
              "  rgba(255,255,255,0.80) 70%," +
              "  transparent 100%)",
          }}
        />

        {/* ── L6 left-rim-light: 좌 캡슐 끝 흰빛 (볼록 곡면) ── */}
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            top: "18%", bottom: "18%",
            left: "-1%", width: "14%",
            background:
              "radial-gradient(ellipse 100% 80% at 10% 50%," +
              "  rgba(255,255,255,0.32) 0%," +
              "  rgba(255,255,255,0.10) 40%," +
              "  transparent 72%)",
            filter: "blur(1.2px)",
          }}
        />

        {/* ── L7 right-corona: 우 핑크 코로나 측면 반사 ── */}
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            top: "10%", bottom: "10%",
            right: "-3%", width: "48%",
            background:
              "radial-gradient(ellipse 100% 85% at 88% 50%," +
              "  rgba(255,200,240,0.44) 0%," +
              "  rgba(255,160,220,0.22) 28%," +
              "  rgba(252,3,165,0.08)   52%," +
              "  transparent            72%)",
            filter: "blur(2px)",
            mixBlendMode: "screen",
          }}
        />

        {/* ── L8 right-rim-hot: 우 캡슐 끝 흰 스펙큘러 ── */}
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            top: "20%", bottom: "20%",
            right: "-0.5%", width: "8%",
            background:
              "radial-gradient(ellipse 100% 75% at 90% 50%," +
              "  rgba(255,255,255,0.52) 0%," +
              "  rgba(255,255,255,0.16) 42%," +
              "  transparent 70%)",
            filter: "blur(0.8px)",
          }}
        />

        {/* ── L9 bottom-caustic: 하단 바닥 코스틱 반사 (황→핑크) ── */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-[9999px]"
          style={{
            height: "38%",
            background:
              "radial-gradient(ellipse 90% 95% at 50% 112%," +
              "  rgba(255,255,255,0.28)  0%," +
              "  rgba(255,220,200,0.12) 26%," +
              "  rgba(252,3,165,0.07)   48%," +
              "  transparent            66%)",
          }}
        />

        {/* ── L10 bottom-rim: 하연 얇은 반사 테두리 ── */}
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            bottom: "1px",
            left: "12%", right: "12%",
            height: "1.5px",
            background:
              "linear-gradient(90deg," +
              "  transparent 0%," +
              "  rgba(255,255,255,0.28) 22%," +
              "  rgba(255,255,255,0.48) 50%," +
              "  rgba(255,200,240,0.35) 76%," +
              "  transparent 100%)",
            filter: "blur(0.4px)",
          }}
        />

        {/* ── L11 text ── */}
        <span
          className="relative z-10 select-none text-[clamp(calc(1.2rem-2pt),calc(2.1vw-2pt),calc(1.9rem-2pt))] font-semibold tracking-[0.01em] text-white"
          style={{
            textShadow: "0 1px 3px rgba(0,0,0,0.65)",
          }}
        >
          시작하기
        </span>
      </button>
    </span>
  );
}

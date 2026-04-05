"use client";

import { useEffect, useState } from "react";

type Part = string | { h: string };

const ROTATION_MS = 5000;
const FADE_MS = 380;

const MESSAGES: Part[][] = [
  [
    "누군가 방금 ",
    { h: "실패와 실수" },
    " 조각을 장바구니에 담았습니다",
  ],
  [
    "지금 ",
    { h: "조각 사치" },
    " 클립을 결제하는 사람이 있어요",
  ],
  [
    "방금 ",
    { h: "에디터 큐레이션" },
    " 모음을 열어봤어요",
  ],
  [
    "누군가 ",
    { h: "오늘의 베스트 구매평" },
    " 카드를 저장했습니다",
  ],
  [
    { h: "실시간 인기순위" },
    " 영상 중 하나가 장바구니에 담겼어요",
  ],
];

function renderLine(parts: Part[]) {
  return parts.map((p, i) =>
    typeof p === "string" ? (
      <span key={i}>{p}</span>
    ) : (
      <span key={i} className="font-semibold text-slate-800">
        {p.h}
      </span>
    ),
  );
}

export function FloatingHuntersBar() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const tick = () => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((j) => (j + 1) % MESSAGES.length);
        setVisible(true);
      }, FADE_MS);
    };
    const id = window.setInterval(tick, ROTATION_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="pointer-events-none fixed bottom-2 left-4 right-4 z-[95] sm:bottom-3 sm:left-6 sm:right-6"
      style={{
        paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))",
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="mx-auto flex max-w-lg justify-center md:max-w-xl">
        <div className="w-full rounded-full border border-slate-200/80 bg-white/88 px-3.5 py-2 text-center shadow-[0_6px_24px_-8px_rgba(15,23,42,0.2)] backdrop-blur-md sm:px-4 sm:py-2">
          <p className="text-[10px] font-semibold tracking-tight text-slate-400 sm:text-[11px]">
            지금 이 조각을 노리는 사람들
          </p>
          <p
            className={`mt-0.5 text-[11px] leading-snug text-slate-600 transition-opacity duration-300 ease-out sm:text-[12px] sm:leading-relaxed ${
              visible ? "opacity-100" : "opacity-0"
            }`}
          >
            {renderLine(MESSAGES[index] ?? MESSAGES[0])}
          </p>
        </div>
      </div>
    </div>
  );
}

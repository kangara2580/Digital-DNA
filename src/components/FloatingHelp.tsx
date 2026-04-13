"use client";

import { ChevronUp } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const SCROLL_TOP_THRESHOLD = 80;

function StylizedBell({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M12.2 2.2c.35-.12.73-.12 1.08 0 1.35.48 2.25 1.72 2.35 3.12l.02.55c0 1.05.35 2.05 1 2.88.55.68.85 1.52.85 2.4v.55c0 1.1-.45 2.12-1.2 2.88-.35.35-.75.65-1.18.88-.25.12-.52.22-.8.28l-.35.08H9.03l-.35-.08a4.7 4.7 0 01-.8-.28 4.05 4.05 0 01-1.18-.88 4.05 4.05 0 01-1.2-2.88v-.55c0-.88.3-1.72.85-2.4a4.9 4.9 0 001-2.88l.02-.55c.1-1.4 1-2.64 2.35-3.12.35-.12.73-.12 1.08 0z"
        className="fill-current opacity-90"
      />
      <path
        d="M9.4 19.2h5.2c.55 0 1 .45 1 1s-.45 1-1 1H9.4c-.55 0-1-.45-1-1s.45-1 1-1z"
        className="fill-current opacity-70"
      />
      <path
        d="M11.2 21.4c.35.55 1.05.75 1.65.45.2-.1.35-.25.45-.45"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        className="opacity-60"
      />
      <circle
        cx="12.4"
        cy="5.1"
        r="1.1"
        className="fill-current opacity-35"
      />
    </svg>
  );
}

const easeExpand = "duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-300";

/** 맨 위로: 살짝만 비치게 하되 아이콘 대비 확보(전체 opacity 금지) */
const scrollTopShell =
  "border border-white/15 bg-reels-void/90 text-zinc-100 shadow-[0_10px_36px_-16px_rgba(0,242,234,0.18)] backdrop-blur-xl";

/** 도움말 펼침: 자식 opacity 애니메이션을 위해 부모에 opacity 금지(배경만 /95) */
const helpLinkShell =
  "border border-white/15 bg-reels-void/92 text-zinc-200 shadow-[0_12px_40px_-18px_rgba(255,0,85,0.12)] backdrop-blur-xl";

export function FloatingHelp() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const readScroll = () => {
      const y =
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      setShowScrollTop(y > SCROLL_TOP_THRESHOLD);
    };
    readScroll();
    window.addEventListener("scroll", readScroll, { passive: true });
    return () => window.removeEventListener("scroll", readScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, []);

  return (
    <div
      className="pointer-events-none fixed bottom-6 right-4 z-[100] flex flex-col items-end gap-2 sm:bottom-8 sm:right-6"
      style={{
        paddingBottom: "max(0px, env(safe-area-inset-bottom))",
        paddingRight: "max(0px, env(safe-area-inset-right))",
      }}
    >
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="맨 위로 가기"
        className={`flex h-11 w-11 items-center justify-center rounded-full ${scrollTopShell} scale-95 opacity-0 transition-[opacity,transform,box-shadow] duration-[400ms] ease-in-out hover:border-reels-cyan/45 hover:bg-white/8 hover:shadow-reels-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-reels-cyan motion-reduce:transition-none ${
          showScrollTop
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none"
        }`}
      >
        <ChevronUp
          className="h-[18px] w-[18px] shrink-0 text-reels-cyan"
          strokeWidth={2.25}
          aria-hidden
        />
      </button>

      <Link
        href="/faq"
        className={`group pointer-events-auto flex h-14 max-w-[3.5rem] flex-row-reverse items-center overflow-hidden rounded-full ${helpLinkShell} transition-[max-width,box-shadow,border-color,background-color] duration-[400ms] ease-in-out ${easeExpand} hover:max-w-[min(92vw,20rem)] hover:border-reels-cyan/40 hover:bg-white/8 hover:shadow-reels-cyan focus-visible:max-w-[min(92vw,20rem)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-reels-cyan`}
        aria-label="FAQ로 이동"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-reels-cyan/15 text-reels-cyan transition-colors duration-500 group-hover:bg-reels-cyan/25">
          <StylizedBell className="block h-[22px] w-[22px] shrink-0" />
        </span>
        <span className="flex min-h-14 min-w-0 flex-1 items-center justify-end overflow-hidden pl-2 pr-2">
          <span
            className={`whitespace-nowrap pl-3 pr-2 text-right text-[13px] font-semibold tracking-tight text-zinc-300 opacity-0 transition-[opacity,transform] duration-[1640ms] ease-[cubic-bezier(0.22,1,0.36,1)] delay-0 motion-reduce:transition-none translate-x-1.5 group-hover:translate-x-0 group-hover:opacity-100 group-hover:delay-[280ms] group-focus-visible:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:delay-[280ms]`}
          >
            FAQ에서 자주 묻는 질문 보기
          </span>
        </span>
      </Link>
    </div>
  );
}

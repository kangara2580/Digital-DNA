"use client";

import { ShoppingCart, User } from "lucide-react";
import Link from "next/link";
import { startTransition, useEffect, useRef, useState } from "react";

const iconStroke = 1.25;

/** 상단 로그인·장바구니 공통: 카테고리 칩과 같은 은은한 회색 호버 */
const navActionClass =
  "inline-flex items-center justify-center rounded-full bg-transparent px-2.5 py-1.5 text-black transition-[background-color,color] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-slate-100/85 hover:text-slate-950 motion-reduce:duration-250";

const ITEMS = [
  { href: "/", label: "베스트" },
  { href: "/", label: "추천" },
  { href: "/", label: "일상" },
  { href: "/", label: "숏폼·릴스" },
  { href: "/", label: "춤" },
  { href: "/", label: "노래" },
  { href: "/", label: "푸드" },
  { href: "/", label: "여행" },
  { href: "/", label: "동물" },
  { href: "/", label: "비즈니스" },
  { href: "/", label: "코미디" },
  { href: "/", label: "만화" },
] as const;

const SCROLL_COMPACT_AT = 56;

/** 헤더 전반: 레이아웃·타이틀·검색 전환 — 더 천천히, 끝부분이 부드럽게 */
const easeHeader =
  "duration-[2000ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-500 motion-reduce:ease-linear";

const easeNav =
  `transition-[padding,margin,font-size,line-height,box-shadow,gap,border-color,width,max-width,flex] ${easeHeader}`;

export function MallTopNav() {
  const [q, setQ] = useState("");
  const headerRef = useRef<HTMLElement>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    let rafId = 0;
    let lastRounded = -1;

    /** 레이아웃 전환 중 매 틱마다 --header-height 갱신하면 메인 스레드·사이드바가 버벅임 → rAF 1프레임 1회 + 동일 높이 스킵 */
    const flushHeight = () => {
      rafId = 0;
      const h = Math.round(el.getBoundingClientRect().height);
      if (h === lastRounded) return;
      lastRounded = h;
      document.documentElement.style.setProperty("--header-height", `${h}px`);
    };

    const scheduleHeight = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(flushHeight);
    };

    const onScroll = () => {
      const next = window.scrollY > SCROLL_COMPACT_AT;
      startTransition(() => setCompact(next));
    };

    const ro = new ResizeObserver(scheduleHeight);
    ro.observe(el);
    scheduleHeight();
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const logoClass = `shrink-0 font-semibold tracking-tight text-[#000000] ${easeNav} ${
    compact ? "text-[13px]" : "text-sm"
  }`;

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 isolate border-b border-slate-200/80 bg-white/90 backdrop-blur-sm [transform:translateZ(0)] ${easeNav} ${
        compact ? "shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)]" : "shadow-none"
      }`}
    >
      <div
        className={`mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 ${easeNav} ${
          compact ? "pb-1.5 pt-1" : "pb-2 pt-1"
        }`}
      >
        <div
          className={`flex min-h-0 w-full [contain:layout] ${easeHeader} ${
            compact ? "relative flex-row flex-nowrap items-center gap-x-2 sm:gap-x-3" : "flex-col"
          }`}
        >
          {/* 로고 줄: 펼침에서만 오른쪽 아이콘 */}
          <div
            className={`flex items-center ${easeHeader} ${
              compact ? "shrink-0" : "w-full justify-between gap-3"
            }`}
          >
            <Link href="/" className={logoClass}>
              디지털 DNA
            </Link>
            {!compact && (
              <div className="hidden shrink-0 items-center gap-0.5 sm:-mr-1 sm:flex lg:-mr-0.5">
                <Link href="/login" className={navActionClass} aria-label="로그인">
                  <User
                    className="h-[20px] w-[20px]"
                    strokeWidth={iconStroke}
                    aria-hidden
                  />
                </Link>
                <Link href="/cart" className={navActionClass} aria-label="장바구니">
                  <ShoppingCart
                    className="h-[20px] w-[20px]"
                    strokeWidth={iconStroke}
                    aria-hidden
                  />
                </Link>
              </div>
            )}
          </div>

          {/* 타이틀: grid-rows 대신 max-height+opacity만 전환(레이아웃 계산 부담 감소). 컴팩트 시 absolute로 한 줄 정렬 유지 */}
          <div
            className={`w-full overflow-hidden transition-[max-height,opacity] ${easeHeader} ${
              compact
                ? "pointer-events-none absolute left-0 top-0 z-0 max-h-0 w-full opacity-0"
                : "relative max-h-[min(320px,50vh)] opacity-100"
            }`}
            aria-hidden={compact}
          >
            <div className={`${!compact ? "mt-1 sm:mt-1.5" : ""}`}>
              <h1 className="text-center text-[28px] font-bold leading-snug tracking-tight text-[#000000] sm:text-[30px]">
                살아있는 일상의 조각을 파는 마켓
              </h1>
            </div>
          </div>

          {/* 검색 + 카테고리: 컴팩트에서는 가로로 붙여 검색(왼쪽)·카테고리(오른쪽) */}
          <div
            className={`flex min-h-0 w-full min-w-0 ${easeHeader} ${
              compact
                ? "flex-1 flex-row items-center gap-2 sm:gap-3"
                : "flex flex-col"
            }`}
          >
            <div
              className={`w-full ${easeNav} ${
                compact
                  ? "mx-0 mt-0 max-w-[min(320px,42vw)] shrink-0 sm:max-w-md"
                  : "mx-auto mt-1 max-w-2xl sm:mt-1.5"
              }`}
            >
              <div className="relative">
                <span
                  className={`pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-slate-400 transition-[left] ${easeHeader} ${
                    compact ? "left-3" : "left-4"
                  }`}
                  aria-hidden
                >
                  <svg
                    className={`text-slate-400 transition-[width,height] ${easeHeader} ${
                      compact ? "h-4 w-4" : "h-[18px] w-[18px]"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </span>
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="키워드, 크리에이터, 분위기로 검색"
                  className={`w-full rounded-2xl border border-slate-200 bg-slate-50 pr-4 text-[#000000] outline-none ring-0 transition-[height,padding,font-size,background-color,border-color,box-shadow] ${easeHeader} placeholder:text-slate-400 hover:bg-[#708090]/15 focus:border-slate-300 focus:bg-white focus:shadow-[0_0_0_1px_rgba(0,0,0,0.06)] ${
                    compact
                      ? "h-9 pl-10 pr-3 text-[13px]"
                      : "h-11 pl-12 text-[14px]"
                  }`}
                  aria-label="검색"
                />
              </div>
            </div>

            <nav
              className={`no-scrollbar flex min-w-0 items-center overflow-x-auto ${easeNav} ${
                compact
                  ? "mt-0 flex-1 justify-start gap-1 border-0 py-0 sm:gap-1.5"
                  : "mt-1.5 justify-center gap-0.5 border-t border-slate-100 pt-1.5 sm:gap-1"
              }`}
              aria-label="카테고리"
            >
              {ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`shrink-0 rounded-full bg-transparent font-medium text-slate-800 transition-[background-color,color,padding,font-size] ${easeHeader} hover:bg-slate-100 hover:text-slate-950 ${
                    compact
                      ? "px-2 py-1 text-[10px] sm:px-2.5 sm:text-[11px]"
                      : "px-3 py-2 text-[11px] sm:px-4 sm:text-[12px]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {compact && (
            <div
              className={`flex shrink-0 items-center gap-0.5 sm:-mr-1 lg:-mr-0.5 ${easeHeader}`}
            >
              <Link href="/login" className={navActionClass} aria-label="로그인">
                <User
                  className="h-[20px] w-[20px]"
                  strokeWidth={iconStroke}
                  aria-hidden
                />
              </Link>
              <Link href="/cart" className={navActionClass} aria-label="장바구니">
                <ShoppingCart
                  className="h-[20px] w-[20px]"
                  strokeWidth={iconStroke}
                  aria-hidden
                />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

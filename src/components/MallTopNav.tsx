"use client";

import { ChevronDown, Search, Wallet } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MALL_CATEGORY_NAV_ITEMS as ITEMS } from "@/data/mallCategoryNav";
import { SEARCH_GUIDE_PHRASES, shuffleSearchGuides } from "@/data/searchGuidePhrases";
import { SitePreferencesMenu } from "@/components/SitePreferencesMenu";

/** 카테고리 pill — 라이트 모드에서 검정 텍스트 */
const categoryPillClass =
  "shrink-0 rounded-full border border-transparent bg-transparent font-semibold text-zinc-400 transition-[background-color,color,padding,font-size,border-color] hover:border-white/15 hover:bg-white/8 hover:text-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:border-zinc-200 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-black";

/** 스크롤 컴팩트 시 상단에는 베스트·추천만 노출, 나머지는 「카테고리」 메뉴로 */
const COMPACT_PRIMARY = ITEMS.slice(0, 2);
const COMPACT_MORE = ITEMS.slice(2);

/** 스크롤을 조금만 내려도 컴팩트가 깜빡이지 않게 진입/이탈 임계를 분리 */
const SCROLL_COMPACT_ENTER = 72;
/** 맨 위 복귀 시 펼침을 조금 일찍 걸어(스크롤이 EXIT 이하로 들어오면 바로 펼침) */
const SCROLL_COMPACT_EXIT = 48;

/**
 * 레이아웃 전환: 조금 더 길게·부드럽게(짧은 스크롤에서 덜 덜덜 거리도록).
 * motion-reduce에서는 짧게 유지.
 */
const easeLayout =
  "duration-[780ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] motion-reduce:duration-200 motion-reduce:ease-linear";

/** 타이틀: 높이만 부드럽게. opacity는 전환에 넣지 않음 → 펼침 순간 글자가 바로 보임(820ms 페이드와 겹치면 ‘늦게 나타남’으로 느껴짐) */
const easeTitleCollapse =
  `transition-[max-height] ${easeLayout}`;

const easeNav = `transition-[padding,margin,font-size,line-height,box-shadow,gap,border-color,width,max-width,flex] ${easeLayout}`;

/** 검색창: 높이·패딩은 easeLayout과 같은 duration(내려갈 때·맨 위로 올릴 때 동일하게 보이도록) */
const searchEase =
  "duration-[780ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] motion-reduce:duration-150 motion-reduce:ease-linear";

/** 돋보기 아이콘: 호버/포커스 시 살짝 커지고 기울어지며 뜨는 느낌(마켓 검색 UX) */
const searchIconMotion =
  "origin-[52%_54%] transition-[transform,color] duration-[320ms] ease-[cubic-bezier(0.34,1.15,0.64,1)] motion-reduce:duration-150 motion-reduce:ease-linear " +
  "group-hover:-translate-y-0.5 group-hover:scale-[1.1] group-hover:-rotate-[10deg] group-hover:text-reels-cyan " +
  "group-focus-within:-translate-y-0.5 group-focus-within:scale-[1.1] group-focus-within:-rotate-[10deg] group-focus-within:text-reels-cyan " +
  "motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:scale-100 motion-reduce:group-hover:rotate-0 " +
  "motion-reduce:group-focus-within:translate-y-0 motion-reduce:group-focus-within:scale-100 motion-reduce:group-focus-within:rotate-0";

const ROTATE_MS = 4500;

function RotatingSearchField({
  compact,
  q,
  setQ,
}: {
  compact: boolean;
  q: string;
  setQ: (v: string) => void;
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion() ?? false;
  const [phrases, setPhrases] = useState<string[]>(() => [...SEARCH_GUIDE_PHRASES]);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setPhrases(shuffleSearchGuides([...SEARCH_GUIDE_PHRASES]));
    setPhraseIdx(0);
  }, [pathname]);

  useEffect(() => {
    if (phrases.length === 0) return;
    const id = window.setInterval(() => {
      setPhraseIdx((i) => (i + 1) % phrases.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [phrases]);

  const showGuide = q.trim() === "" && !focused;
  const current = phrases[phraseIdx] ?? phrases[0] ?? "";
  const slideY = compact ? 14 : 18;

  return (
    <div className="group relative">
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder=""
        autoComplete="off"
        enterKeyHint="search"
        className={`mall-search w-full rounded-full border text-zinc-100 outline-none ring-0 transition-[height,padding,font-size,background-color,border-color,box-shadow,color] ${easeLayout} ${searchEase} border-white/15 bg-white/[0.06] placeholder:text-zinc-600 hover:border-reels-cyan/35 hover:bg-white/10 hover:shadow-[0_2px_20px_-8px_rgba(155,109,255,0.18)] focus:border-reels-cyan/50 focus:bg-white/[0.09] focus:shadow-[0_4px_24px_-8px_rgba(255,79,179,0.18)] focus:ring-0 [html[data-theme='dark']_&]:border-white/20 [html[data-theme='dark']_&]:bg-white/[0.1] [html[data-theme='dark']_&]:text-zinc-50 [html[data-theme='dark']_&]:placeholder:text-zinc-300 [html[data-theme='dark']_&]:hover:bg-white/[0.14] [html[data-theme='dark']_&]:focus:bg-white/[0.16] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:placeholder:text-zinc-500 [html[data-theme='light']_&]:hover:border-zinc-300 [html[data-theme='light']_&]:hover:bg-white [html[data-theme='light']_&]:focus:border-zinc-400 [html[data-theme='light']_&]:focus:bg-white ${
          compact
            ? "h-9 pl-3 pr-10 text-[13px]"
            : "h-11 pl-5 pr-12 text-[14px]"
        }`}
        aria-label={`조각 검색. 안내: ${current}`}
      />
      {showGuide ? (
        <div
          className={`pointer-events-none absolute inset-y-0 left-0 flex items-center overflow-hidden text-left text-zinc-500 [html[data-theme='dark']_&]:text-zinc-300 [html[data-theme='light']_&]:text-zinc-500 ${
            compact ? "right-10 pl-3 text-[13px]" : "right-12 pl-5 text-[14px]"
          }`}
          aria-hidden
        >
          <div className="relative w-full min-w-0">
            <div
              className={`overflow-hidden ${compact ? "h-[18px]" : "h-[22px]"}`}
            >
              {reduceMotion ? (
                <span className="block truncate">{current}</span>
              ) : (
                <AnimatePresence initial={false} mode="wait">
                  <motion.span
                    key={`${pathname}-${phraseIdx}-${current}`}
                    initial={{ y: slideY, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -slideY, opacity: 0 }}
                    transition={{
                      duration: 0.42,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="block truncate"
                  >
                    {current}
                  </motion.span>
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      ) : null}
      <span
        className={`pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-zinc-500 [html[data-theme='dark']_&]:text-zinc-200 [html[data-theme='light']_&]:text-zinc-600 ${
          compact ? "right-2.5" : "right-3.5"
        }`}
        aria-hidden
      >
        <span className={`block ${searchIconMotion}`}>
          <Search
            className={`shrink-0 ${compact ? "h-4 w-4" : "h-[18px] w-[18px]"}`}
            strokeWidth={2}
            aria-hidden
          />
        </span>
      </span>
    </div>
  );
}

const subscribeNavClass =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-reels-cyan/45 bg-gradient-to-r from-reels-cyan/12 to-reels-cyan/5 text-reels-cyan shadow-[0_0_18px_-10px_rgba(0,242,234,0.35)] transition hover:border-reels-cyan/70 hover:from-reels-cyan/22 hover:to-reels-cyan/10 sm:size-10 [html[data-theme='light']_&]:border-reels-cyan/40 [html[data-theme='light']_&]:from-reels-cyan/12 [html[data-theme='light']_&]:to-white/90";

function SubscribeNavLink() {
  return (
    <Link
      href="/subscribe"
      className={subscribeNavClass}
      aria-label="구독·결제 페이지로 이동"
      title="구독"
    >
      <Wallet className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]" strokeWidth={2} aria-hidden />
    </Link>
  );
}

export function MallTopNav() {
  const { scrollY } = useScroll();
  const reduceMotionNav = useReducedMotion() ?? false;
  /** 패럴랙스는 원시 scrollY만(스프링 제거 — 맨 위에서 스프링이 늦게 따라와 타이틀 위치가 어긋남) */
  const heroTitleY = useTransform(scrollY, [0, 180], [0, reduceMotionNav ? 0 : -12]);
  const [q, setQ] = useState("");
  const headerRef = useRef<HTMLElement>(null);
  const [compact, setCompact] = useState(false);
  const pathname = usePathname();
  /** 탐색(/explore): 메인에서 스크롤을 내린 것과 같은 컴팩트 헤더를 즉시 적용 */
  const compactEffective = compact || pathname === "/explore";
  const [moreOpen, setMoreOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const moreWrapRef = useRef<HTMLDivElement>(null);
  const menuPortalRef = useRef<HTMLDivElement>(null);
  const hoverCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuPlace, setMenuPlace] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    let rafId = 0;
    let lastRounded = -1;

    /** 레이아웃 전환 중 매 틱마다 --header-height 갱신하면 메인 스레드·사이드바가 버벅임 → rAF 1프레임 1회 + 동일 높이 스킵 */
    let debounceT = 0;

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

    /** 전환 중 연속 리사이즈 → 짧은 스크롤에서도 높이 갱신이 너무 촘촘하면 버벅임. 약간 여유 두기 */
    const scheduleHeightDebounced = () => {
      window.clearTimeout(debounceT);
      debounceT = window.setTimeout(() => {
        debounceT = 0;
        scheduleHeight();
      }, 96);
    };

    const ro = new ResizeObserver(scheduleHeightDebounced);
    ro.observe(el);
    scheduleHeight();

    return () => {
      window.clearTimeout(debounceT);
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  /** 컴팩트: 히스테리시스는 원시 스크롤로 즉시 반영(CSS 전환만 부드럽게). 스프링으로 판정하면 맨 위에서 타이틀이 한 박자 늦게 펼쳐짐 */
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setCompact((prev) => {
        if (prev) return y > SCROLL_COMPACT_EXIT;
        return y > SCROLL_COMPACT_ENTER;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!compactEffective) setMoreOpen(false);
  }, [compactEffective]);

  const cancelHoverClose = useCallback(() => {
    if (hoverCloseTimerRef.current != null) {
      clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
  }, []);

  const scheduleHoverClose = useCallback(() => {
    cancelHoverClose();
    hoverCloseTimerRef.current = setTimeout(() => {
      setMoreOpen(false);
      hoverCloseTimerRef.current = null;
    }, 220);
  }, [cancelHoverClose]);

  const openCategoryMenu = useCallback(() => {
    cancelHoverClose();
    setMoreOpen(true);
  }, [cancelHoverClose]);

  const measureMenu = useCallback(() => {
    const tr = moreWrapRef.current;
    if (!tr || typeof window === "undefined") return;
    const r = tr.getBoundingClientRect();
    const vw = window.innerWidth;
    const edge = 12;
    const width = Math.min(720, Math.max(280, vw - edge * 2));
    const centerX = r.left + r.width / 2;
    let left = centerX - width / 2;
    left = Math.max(edge, Math.min(left, vw - width - edge));
    setMenuPlace({
      top: r.bottom + 2,
      left,
      width,
    });
  }, []);

  useLayoutEffect(() => {
    if (!moreOpen) {
      setMenuPlace(null);
      return;
    }
    measureMenu();
    window.addEventListener("scroll", measureMenu, true);
    window.addEventListener("resize", measureMenu);
    return () => {
      window.removeEventListener("scroll", measureMenu, true);
      window.removeEventListener("resize", measureMenu);
    };
  }, [moreOpen, measureMenu]);

  useEffect(() => {
    if (!moreOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const n = e.target as Node;
      if (moreWrapRef.current?.contains(n) || menuPortalRef.current?.contains(n))
        return;
      cancelHoverClose();
      setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cancelHoverClose();
        setMoreOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen, cancelHoverClose]);

  useEffect(() => {
    return () => cancelHoverClose();
  }, [cancelHoverClose]);

  const logoClass = `flex shrink-0 items-center gap-2 font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 ${easeNav} ${
    compactEffective ? "text-[12px]" : "text-sm"
  }`;

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 isolate border-b border-white/10 bg-reels-abyss/72 backdrop-blur-xl [transform:translateZ(0)] [html[data-theme='light']_&]:border-zinc-200/90 [html[data-theme='light']_&]:bg-white/95 [html[data-theme='light']_&]:shadow-[0_1px_0_rgba(0,0,0,0.06)] ${easeNav} ${
        compactEffective
          ? "overflow-visible shadow-[0_12px_40px_-16px_rgba(255,0,85,0.18)] [html[data-theme='light']_&]:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)]"
          : "shadow-none"
      }`}
    >
      <div
        className={`mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 ${easeNav} ${
          compactEffective ? "pb-1.5 pt-1" : "pb-1.5 pt-0.5"
        }`}
      >
        <div
          className={`flex min-h-0 w-full [contain:layout] ${easeLayout} ${
            compactEffective
              ? "relative flex-row flex-nowrap items-center gap-x-2 overflow-visible sm:gap-x-3"
              : "flex-col"
          }`}
        >
          {/* 로고 줄: 펼침에서만 오른쪽 아이콘 */}
          <div
            className={`flex items-center ${easeLayout} ${
              compactEffective ? "shrink-0" : "w-full justify-between gap-3"
            }`}
          >
            <Link href="/" className={`${logoClass} sr-only`}>
              홈으로 이동
            </Link>
            {!compactEffective && (
              <div className="flex items-center gap-2 sm:gap-2.5">
                <SubscribeNavLink />
                <div className="hidden items-center gap-0.5 sm:flex sm:-mr-1 lg:-mr-0.5 md:hidden">
                  <SitePreferencesMenu />
                </div>
              </div>
            )}
          </div>

          {/* 타이틀: grid-rows 대신 max-height+opacity만 전환(레이아웃 계산 부담 감소). 컴팩트 시 absolute로 한 줄 정렬 유지 */}
          <div
            className={`w-full overflow-hidden ${easeTitleCollapse} ${
              compactEffective
                ? "pointer-events-none absolute left-0 top-0 z-0 max-h-0 w-full opacity-0"
                : "relative max-h-[min(300px,48vh)] opacity-100"
            }`}
            aria-hidden={compactEffective}
          >
            <div className={`${!compactEffective ? "mt-0 sm:mt-0.5" : ""}`}>
              <Link
                href="/"
                className="mx-auto block w-fit max-w-full rounded-sm outline-none transition-[opacity,transform] duration-200 hover:opacity-[0.9] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-reels-cyan/60 focus-visible:ring-offset-2 focus-visible:ring-offset-reels-abyss [html[data-theme='light']_&]:focus-visible:ring-offset-white"
                aria-label="홈 · 메인 화면으로 이동"
              >
                <motion.div
                  style={{ y: heroTitleY }}
                  className="text-center"
                >
                  <p className="mx-auto mb-1 inline-flex items-center gap-1.5 rounded-full border border-[#1fd7d8]/45 bg-[#0c2e45]/72 px-2.5 py-0.5 text-[11px] font-semibold text-[#c9fcff] shadow-[0_0_24px_-10px_rgba(31,215,216,0.8)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1fd7d8] shadow-[0_0_10px_rgba(31,215,216,0.95)]" aria-hidden />
                    바이럴 릴스를 사고, 클론하고, 성장하세요
                  </p>
                  <p className="mt-0 bg-gradient-to-r from-[#b9ffff] via-[#46eef1] to-[#12d8dd] bg-clip-text text-[52px] font-black leading-[0.96] tracking-tight text-transparent [text-shadow:0_10px_34px_rgba(9,26,45,0.38),0_0_24px_rgba(31,215,216,0.35)] sm:text-[64px] md:text-[76px]">
                    ReelsMarket
                  </p>
                </motion.div>
              </Link>
            </div>
          </div>

          {/* 검색 + 카테고리: 컴팩트에서는 가로로 붙여 검색(왼쪽)·카테고리(오른쪽) */}
          <div
            className={`flex min-h-0 w-full min-w-0 ${easeLayout} ${
              compactEffective
                ? "flex-1 flex-row items-center gap-2 overflow-visible sm:gap-3"
                : "flex flex-col"
            }`}
          >
            <div
              className={`w-full ${easeNav} ${
                compactEffective
                  ? "mx-0 mt-0 max-w-[min(320px,42vw)] shrink-0 sm:max-w-md"
                  : "mx-auto mt-0.5 max-w-2xl sm:mt-1"
              }`}
            >
              <RotatingSearchField compact={compactEffective} q={q} setQ={setQ} />
            </div>

            <nav
              className={`flex min-w-0 items-center ${easeNav} ${
                compactEffective
                  ? "mt-0 flex-1 justify-center gap-1 overflow-visible border-0 py-0 sm:gap-1.5"
                  : "no-scrollbar mt-1 justify-center gap-1 overflow-x-auto border-t border-white/10 pt-1 sm:gap-1.5 [html[data-theme='light']_&]:border-zinc-200"
              }`}
              aria-label="카테고리"
            >
              {compactEffective ? (
                <>
                  {COMPACT_PRIMARY.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`${categoryPillClass} ${easeLayout} px-2 py-1 text-[10px] sm:px-2.5 sm:text-[11px]`}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div
                    ref={moreWrapRef}
                    className="relative shrink-0"
                    onMouseEnter={openCategoryMenu}
                    onMouseLeave={scheduleHoverClose}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        cancelHoverClose();
                        setMoreOpen((o) => !o);
                      }}
                      aria-expanded={moreOpen}
                      aria-haspopup="true"
                      aria-controls="mall-category-more"
                      id="mall-category-trigger"
                      className={`inline-flex items-center gap-0.5 ${categoryPillClass} ${easeLayout} px-2 py-1 text-[10px] sm:px-2.5 sm:text-[11px]`}
                    >
                      카테고리
                      <ChevronDown
                        className={`h-3.5 w-3.5 shrink-0 opacity-70 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`}
                        strokeWidth={2}
                        aria-hidden
                      />
                    </button>
                    {mounted &&
                      moreOpen &&
                      menuPlace &&
                      createPortal(
                        <div
                          ref={menuPortalRef}
                          id="mall-category-more"
                          role="region"
                          aria-labelledby="mall-category-trigger"
                          className="rounded-xl border border-white/15 bg-reels-void/95 shadow-[0_20px_50px_-12px_rgba(0,242,234,0.12)] backdrop-blur-xl transition-[opacity,transform] duration-200 ease-out [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-[0_20px_40px_-16px_rgba(0,0,0,0.12)]"
                          style={{
                            position: "fixed",
                            top: menuPlace.top,
                            left: menuPlace.left,
                            width: menuPlace.width,
                            zIndex: 9999,
                          }}
                          onMouseEnter={openCategoryMenu}
                          onMouseLeave={scheduleHoverClose}
                        >
                          <div className="no-scrollbar flex justify-center overflow-x-auto px-2 py-1 sm:px-2.5 sm:py-1.5">
                            <nav
                              className="inline-flex min-w-0 flex-nowrap items-center justify-center gap-1 sm:gap-1.5"
                              aria-label="추가 카테고리"
                            >
                              {COMPACT_MORE.map((item) => (
                                <Link
                                  key={item.label}
                                  href={item.href}
                                  onClick={() => {
                                    cancelHoverClose();
                                    setMoreOpen(false);
                                  }}
                                  className={`shrink-0 whitespace-nowrap rounded-full px-1.5 py-1 text-[10px] font-semibold text-zinc-300 transition-colors duration-200 first:pl-2 last:pr-2 sm:px-2 sm:text-[11px] sm:first:pl-2.5 sm:last:pr-2.5 ${easeLayout} hover:bg-white/10 hover:text-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-black`}
                                >
                                  {item.label}
                                </Link>
                              ))}
                            </nav>
                          </div>
                        </div>,
                        document.body,
                      )}
                  </div>
                </>
              ) : (
                ITEMS.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`${categoryPillClass} ${easeLayout} px-2.5 py-1.5 text-[11px] sm:px-3 sm:py-2 sm:text-[12px]`}
                  >
                    {item.label}
                  </Link>
                ))
              )}
            </nav>
          </div>

          {compactEffective && (
            <div
              className={`flex shrink-0 items-center gap-1.5 sm:gap-2 sm:-mr-1 lg:-mr-0.5 ${easeLayout}`}
            >
              <SubscribeNavLink />
              <div className="md:hidden">
                <SitePreferencesMenu />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

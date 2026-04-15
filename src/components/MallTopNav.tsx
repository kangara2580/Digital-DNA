"use client";

import { ChevronDown, Search, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
const SCROLL_COMPACT_ENTER = 96;
/** 맨 위 복귀 시 펼침을 조금 일찍 걸어(스크롤이 EXIT 이하로 들어오면 바로 펼침) */
const SCROLL_COMPACT_EXIT = 32;

/** 짧은 전환 — 긴 스크롤 구간에서 레이아웃·블러 재계산 부담을 줄임 */
const easeLayout =
  "duration-300 ease-out motion-reduce:duration-150 motion-reduce:ease-linear";

/** 타이틀: 높이만 부드럽게. opacity는 전환에 넣지 않음 → 펼침 순간 글자가 바로 보임(820ms 페이드와 겹치면 ‘늦게 나타남’으로 느껴짐) */
const easeTitleCollapse =
  `transition-[max-height] ${easeLayout}`;

const easeNav = `transition-[padding,margin,font-size,line-height,box-shadow,gap,border-color,width,max-width,flex] ${easeLayout}`;

const searchEase =
  "duration-300 ease-out motion-reduce:duration-150 motion-reduce:ease-linear";

/** 돋보기: 색만 살짝 (변형·회전 제거로 스크롤/페인트 부담 감소) */
const searchIconMotion =
  "transition-colors duration-200 ease-out group-hover:text-reels-cyan group-focus-within:text-reels-cyan";

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
        className={`mall-search w-full rounded-full border text-zinc-100 outline-none ring-0 transition-[height,padding,font-size,background-color,border-color,color] ${easeLayout} ${searchEase} placeholder:text-zinc-600 focus:ring-0 [html[data-theme='dark']_&]:text-zinc-50 [html[data-theme='dark']_&]:placeholder:text-zinc-300 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:placeholder:text-zinc-500 ${
          compact
            ? "h-9 border-white/15 bg-white/[0.06] pl-3 pr-10 text-[13px] hover:border-reels-cyan/35 hover:bg-white/10 focus:border-reels-cyan/50 focus:bg-white/[0.09] [html[data-theme='dark']_&]:border-white/20 [html[data-theme='dark']_&]:bg-white/[0.1] [html[data-theme='dark']_&]:hover:bg-white/[0.14] [html[data-theme='dark']_&]:focus:bg-white/[0.16] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:hover:border-zinc-300 [html[data-theme='light']_&]:hover:bg-white [html[data-theme='light']_&]:focus:border-zinc-400 [html[data-theme='light']_&]:focus:bg-white"
            : "h-[3.25rem] border-2 border-white/20 bg-white/[0.08] pl-6 pr-14 text-[15px] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-reels-cyan/40 hover:bg-white/12 focus:border-reels-cyan/55 focus:bg-white/[0.1] [html[data-theme='dark']_&]:border-white/25 [html[data-theme='dark']_&]:bg-white/[0.12] [html[data-theme='dark']_&]:hover:bg-white/[0.16] [html[data-theme='dark']_&]:focus:bg-white/[0.18] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] [html[data-theme='light']_&]:hover:border-reels-cyan/35 [html[data-theme='light']_&]:hover:bg-zinc-50 [html[data-theme='light']_&]:focus:border-reels-cyan/35 [html[data-theme='light']_&]:focus:bg-white"
        }`}
        aria-label={`릴스 검색. 안내: ${current}`}
      />
      {showGuide ? (
        <div
          className={`pointer-events-none absolute inset-y-0 left-0 flex items-center overflow-hidden text-left text-zinc-500 [html[data-theme='dark']_&]:text-zinc-300 [html[data-theme='light']_&]:text-zinc-500 ${
            compact ? "right-10 pl-3 text-[13px]" : "right-14 pl-6 text-[15px]"
          }`}
          aria-hidden
        >
          <div className="relative w-full min-w-0">
            <div
              className={`overflow-hidden ${compact ? "h-[18px]" : "h-[24px]"}`}
            >
              <span className="block truncate transition-opacity duration-200">
                {current}
              </span>
            </div>
          </div>
        </div>
      ) : null}
      <span
        className={`pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-zinc-500 [html[data-theme='dark']_&]:text-zinc-200 [html[data-theme='light']_&]:text-zinc-600 ${
          compact ? "right-2.5" : "right-4"
        }`}
        aria-hidden
      >
        <span className={`block ${searchIconMotion}`}>
          <Search
            className={`shrink-0 ${compact ? "h-4 w-4" : "h-5 w-5"}`}
            strokeWidth={2}
            aria-hidden
          />
        </span>
      </span>
    </div>
  );
}

const subscribeNavClass =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-reels-cyan/40 bg-reels-cyan/10 text-reels-cyan transition hover:bg-reels-cyan/15 sm:size-10 [html[data-theme='light']_&]:border-reels-cyan/35 [html[data-theme='light']_&]:bg-reels-cyan/10";

/** md 미만: 좌측 레일이 없어서 우측 상단 고정 유지. md+: 레일의 구독 버튼만 사용 */
const subscribeFixedWrap =
  "pointer-events-auto fixed right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.5rem,env(safe-area-inset-top))] z-[45] md:right-6 md:hidden";

function FixedSubscribeNavLink() {
  return (
    <Link
      href="/subscribe"
      className={`${subscribeNavClass} ${subscribeFixedWrap}`}
      aria-label="구독·결제 페이지로 이동"
      title="구독"
    >
      <Wallet className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]" strokeWidth={2} aria-hidden />
    </Link>
  );
}

export function MallTopNav() {
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
  /** 스크롤 핸들러마다 setState하지 않고, rAF 1프레임·실제 전환 시에만 갱신(트랙패드 미세 스크롤 버벅임 완화) */
  const compactRafRef = useRef(0);
  const scrollYRef = useRef(0);
  const compactMirrorRef = useRef(false);
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

  useEffect(() => {
    compactMirrorRef.current = compact;
  }, [compact]);

  /** 컴팩트: rAF 1프레임에 묶고, 값이 바뀔 때만 setState — 트랙패드·관성 스크롤 시 연속 setState·레이아웃 전환 완화 */
  useEffect(() => {
    const applyCompactFromScroll = () => {
      compactRafRef.current = 0;
      const y = scrollYRef.current;
      const prev = compactMirrorRef.current;
      const next = prev ? y > SCROLL_COMPACT_EXIT : y > SCROLL_COMPACT_ENTER;
      if (next !== prev) {
        compactMirrorRef.current = next;
        setCompact(next);
      }
    };

    const onScroll = () => {
      scrollYRef.current = window.scrollY;
      if (!compactRafRef.current) {
        compactRafRef.current = window.requestAnimationFrame(applyCompactFromScroll);
      }
    };

    scrollYRef.current = typeof window !== "undefined" ? window.scrollY : 0;
    applyCompactFromScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (compactRafRef.current) {
        window.cancelAnimationFrame(compactRafRef.current);
        compactRafRef.current = 0;
      }
    };
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
    <Fragment>
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 isolate border-b border-white/10 bg-reels-abyss/90 backdrop-blur-sm [transform:translateZ(0)] [html[data-theme='light']_&]:border-zinc-200/90 [html[data-theme='light']_&]:bg-white/95 [html[data-theme='light']_&]:shadow-[0_1px_0_rgba(0,0,0,0.06)] ${easeNav} ${
        compactEffective
          ? "overflow-visible shadow-[0_8px_24px_-16px_rgba(0,0,0,0.35)] [html[data-theme='light']_&]:shadow-[0_6px_20px_-12px_rgba(0,0,0,0.08)]"
          : "shadow-none"
      }`}
    >
      <div
        className={`mx-auto max-w-[1800px] pl-4 sm:pl-6 lg:pl-8 reels-pr-safe-fixed ${easeNav} ${
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
          {/* 컴팩트: 스크린리더용 홈 링크만 */}
          {compactEffective ? (
            <div className={`flex shrink-0 items-center ${easeLayout}`}>
              <Link href="/" className={`${logoClass} sr-only`}>
                홈으로 이동
              </Link>
            </div>
          ) : null}

          {/* 펼침: 로고 좌 | 검색 우 / 컴팩트 시 접힘 */}
          <div
            className={`w-full overflow-hidden ${easeTitleCollapse} ${
              compactEffective
                ? "pointer-events-none absolute left-0 top-0 z-0 max-h-0 w-full opacity-0"
                : "relative max-h-[min(280px,50vh)] opacity-100"
            }`}
            aria-hidden={compactEffective}
          >
            {!compactEffective ? (
              <div className="pt-0.5">
                <div className="flex w-full min-w-0 flex-nowrap items-center gap-2 sm:gap-5">
                  <Link
                    href="/"
                    className="shrink-0 rounded-sm text-left outline-none transition-opacity duration-200 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-reels-cyan/60 focus-visible:ring-offset-2 focus-visible:ring-offset-reels-abyss [html[data-theme='light']_&]:focus-visible:ring-offset-white"
                    aria-label="홈 · 메인 화면으로 이동"
                  >
                    <span className="block whitespace-nowrap text-[clamp(1.15rem,3.2vw,2rem)] font-black leading-none tracking-tight text-reels-cyan [html[data-theme='light']_&]:text-[#0d9488]">
                      ReelsMarket
                    </span>
                  </Link>
                  <div className="min-w-0 flex-1 sm:min-w-[12rem]">
                    <RotatingSearchField compact={false} q={q} setQ={setQ} />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* 검색 + 카테고리: 펼침에서는 검색은 위 행에만 / 컴팩트는 검색+카테고리 */}
          <div
            className={`flex min-h-0 w-full min-w-0 ${easeLayout} ${
              compactEffective
                ? "flex-1 flex-row items-center gap-2 overflow-visible sm:gap-3"
                : "flex flex-col"
            }`}
          >
            {compactEffective ? (
              <div
                className={`min-w-0 ${easeNav} mx-0 mt-0 max-w-[min(20rem,100%)] shrink sm:max-w-sm`}
              >
                <RotatingSearchField compact q={q} setQ={setQ} />
              </div>
            ) : null}

            <nav
              className={`flex min-w-0 items-center ${easeNav} ${
                compactEffective
                  ? "mt-0 flex-1 justify-center gap-1 overflow-visible border-0 py-0 sm:gap-1.5"
                  : "no-scrollbar mt-3 justify-center gap-1 overflow-x-auto border-t border-white/10 pt-2 sm:gap-1.5 [html[data-theme='light']_&]:border-zinc-200"
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
                          className="rounded-xl border border-white/15 bg-reels-void/98 shadow-lg transition-[opacity,transform] duration-200 ease-out [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.12)]"
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
              <div className="md:hidden">
                <SitePreferencesMenu />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
    <FixedSubscribeNavLink />
    </Fragment>
  );
}

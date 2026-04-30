"use client";

import { ChevronDown, ChevronLeft, ChevronRight, Search, ShoppingCart, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { MainTopUserMenu } from "@/components/MainTopUserMenu";
import { useAuthSession } from "@/hooks/useAuthSession";

/** 카테고리 pill — 라이트 모드에서 검정 텍스트 */
const categoryPillClass =
  "inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-transparent font-semibold leading-none text-zinc-400 transition-[background-color,color,padding,font-size,border-color] hover:border-white/15 hover:bg-white/8 hover:text-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:border-zinc-200 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-black";

/** 현재 카테고리(선택됨): 다크에서는 순백·더 굵게(! 로 베이스 zinc-400 무시), 라이트에서는 거의 검정·굵게 */
const categoryPillActiveClass =
  "cursor-default border-white/22 bg-white/10 font-extrabold !text-[#ffffff] hover:border-white/25 hover:bg-white/14 hover:!text-[#ffffff] [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:!text-zinc-950 [html[data-theme='light']_&]:hover:border-zinc-400 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:!text-zinc-950";

/** 스크롤 컴팩트 시 상단에는 베스트·추천만 노출, 나머지는 「카테고리」 메뉴로 */
const COMPACT_PRIMARY = ITEMS.slice(0, 2);
const COMPACT_MORE = ITEMS.slice(2);

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
  showTrailingIcon = true,
  onAfterSearch,
}: {
  compact: boolean;
  q: string;
  setQ: (v: string) => void;
  showTrailingIcon?: boolean;
  /** 검색으로 이동한 직후(예: 상세 화면 검색 드롭다운 닫기) */
  onAfterSearch?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [phrases, setPhrases] = useState<string[]>(() => [...SEARCH_GUIDE_PHRASES]);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [focused, setFocused] = useState(false);

  const runSearch = useCallback(() => {
    const t = q.trim();
    if (!t) return;
    router.push(`/search?q=${encodeURIComponent(t)}`);
    onAfterSearch?.();
  }, [q, router, onAfterSearch]);

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
    <form
      className="group relative"
      onSubmit={(e) => {
        e.preventDefault();
        runSearch();
      }}
    >
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
            ? `h-9 border-white/15 bg-white/[0.06] pl-3 ${showTrailingIcon ? "pr-10" : "pr-3"} text-[13px] hover:border-reels-cyan/35 hover:bg-white/10 focus:border-reels-cyan/50 focus:bg-white/[0.09] [html[data-theme='dark']_&]:border-white/20 [html[data-theme='dark']_&]:bg-white/[0.1] [html[data-theme='dark']_&]:hover:bg-white/[0.14] [html[data-theme='dark']_&]:focus:bg-white/[0.16] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:hover:border-zinc-300 [html[data-theme='light']_&]:hover:bg-white [html[data-theme='light']_&]:focus:border-zinc-400 [html[data-theme='light']_&]:focus:bg-white`
            : `h-[3.25rem] border-2 border-white/20 bg-white/[0.08] pl-6 ${showTrailingIcon ? "pr-14" : "pr-6"} text-[15px] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-reels-cyan/40 hover:bg-white/12 focus:border-reels-cyan/55 focus:bg-white/[0.1] [html[data-theme='dark']_&]:border-white/25 [html[data-theme='dark']_&]:bg-white/[0.12] [html[data-theme='dark']_&]:hover:bg-white/[0.16] [html[data-theme='dark']_&]:focus:bg-white/[0.18] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] [html[data-theme='light']_&]:hover:border-reels-cyan/35 [html[data-theme='light']_&]:hover:bg-zinc-50 [html[data-theme='light']_&]:focus:border-reels-cyan/35 [html[data-theme='light']_&]:focus:bg-white`
        }`}
        aria-label={`릴스 검색. 안내: ${current}`}
      />
      {showGuide ? (
        <div
          className={`pointer-events-none absolute inset-y-0 left-0 flex items-center overflow-hidden text-left text-zinc-500 [html[data-theme='dark']_&]:text-zinc-300 [html[data-theme='light']_&]:text-zinc-500 ${
            compact
              ? `${showTrailingIcon ? "right-10" : "right-3"} pl-3 text-[13px]`
              : `${showTrailingIcon ? "right-14" : "right-6"} pl-6 text-[15px]`
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
      {showTrailingIcon ? (
        <button
          type="submit"
          className={`absolute top-1/2 z-10 -translate-y-1/2 rounded-full p-1 text-zinc-500 transition-colors hover:text-reels-cyan focus-visible:outline focus-visible:ring-2 focus-visible:ring-reels-cyan/50 [html[data-theme='dark']_&]:text-zinc-200 [html[data-theme='light']_&]:text-zinc-600 ${
            compact ? "right-1.5" : "right-3"
          }`}
          aria-label="검색 실행"
        >
          <span className={`block ${searchIconMotion}`}>
            <Search
              className={`shrink-0 ${compact ? "h-4 w-4" : "h-5 w-5"}`}
              strokeWidth={2}
              aria-hidden
            />
          </span>
        </button>
      ) : null}
    </form>
  );
}

const subscribeNavClass =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-reels-cyan/40 bg-reels-cyan/10 text-reels-cyan transition hover:bg-reels-cyan/15 sm:size-10 [html[data-theme='light']_&]:border-reels-cyan/35 [html[data-theme='light']_&]:bg-reels-cyan/10";

const cartNavClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-zinc-200 transition hover:text-white [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-800";

/** md 미만: 좌측 레일이 없어서 우측 상단 고정 유지. md+: 레일의 구독 버튼만 사용 */
const subscribeFixedWrap =
  "pointer-events-auto fixed right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.5rem,env(safe-area-inset-top))] z-[45] md:right-6 md:hidden";

function FixedSubscribeNavLink() {
  const pathname = usePathname();
  const { user } = useAuthSession();
  if (!user || !pathname.startsWith("/mypage")) return null;
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
  const headerRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthSession();
  const isHomePage = pathname === "/";
  const isShopPage = pathname === "/shop";
  const isVideoDetailPage =
    pathname.startsWith("/video/") && !pathname.endsWith("/customize");
  const isCategoryPage = pathname.startsWith("/category/");
  /** 탐색/카테고리: 메인에서 스크롤 내린 것과 같은 컴팩트 헤더를 즉시 적용 */
  const compactEffective =
    pathname === "/explore" || isShopPage || isCategoryPage || isVideoDetailPage;
  const [isExploreWatchMode, setIsExploreWatchMode] = useState(false);
  const showCategoryNav = (isShopPage || isCategoryPage) && !isExploreWatchMode;
  const showAllCategoriesInline =
    (isShopPage || isCategoryPage) && !isExploreWatchMode;
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
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollCategoryLeft, setCanScrollCategoryLeft] = useState(false);
  const [canScrollCategoryRight, setCanScrollCategoryRight] = useState(false);

  const syncCategoryScrollState = useCallback(() => {
    const el = categoryScrollRef.current;
    if (!el) {
      setCanScrollCategoryLeft(false);
      setCanScrollCategoryRight(false);
      return;
    }
    const maxLeft = Math.max(0, el.scrollWidth - el.clientWidth);
    setCanScrollCategoryLeft(el.scrollLeft > 2);
    setCanScrollCategoryRight(maxLeft - el.scrollLeft > 2);
  }, []);

  const scrollCategoryRow = useCallback((dir: -1 | 1) => {
    const el = categoryScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 220, behavior: "smooth" });
  }, []);

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
    setMounted(true);
  }, []);

  useEffect(() => {
    const syncExploreMode = () => {
      if (typeof document === "undefined") return;
      const isWatch = document.documentElement.dataset.exploreMode === "watch";
      setIsExploreWatchMode(isWatch);
      if (isWatch) {
        document.documentElement.style.setProperty("--header-height", "0px");
      }
    };
    syncExploreMode();
    window.addEventListener("reels:explore-mode", syncExploreMode);
    return () => {
      window.removeEventListener("reels:explore-mode", syncExploreMode);
    };
  }, []);

  // 영상 상세 페이지에서도 헤더 높이를 0으로 설정
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isVideoDetailPage) {
      document.documentElement.style.setProperty("--header-height", "0px");
    }
  }, [isVideoDetailPage]);

  useEffect(() => {
    if (!compactEffective) setMoreOpen(false);
  }, [compactEffective]);

  useEffect(() => {
    if (!showCategoryNav) return;
    const timer = window.setTimeout(() => {
      for (const item of ITEMS) {
        router.prefetch(item.href);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router, showCategoryNav]);

  useEffect(() => {
    if (!showAllCategoriesInline) {
      setCanScrollCategoryLeft(false);
      setCanScrollCategoryRight(false);
      return;
    }
    const el = categoryScrollRef.current;
    if (!el) return;
    const init = () => {
      el.scrollTo({ left: 0, behavior: "auto" });
      syncCategoryScrollState();
    };
    const rafId = window.requestAnimationFrame(init);
    const onScroll = () => syncCategoryScrollState();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.cancelAnimationFrame(rafId);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname, showAllCategoriesInline, syncCategoryScrollState]);

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

  useEffect(() => {
    if (!isHomePage || typeof document === "undefined") return;
    document.documentElement.style.setProperty("--header-height", "0px");
  }, [isHomePage]);

  if (isHomePage) {
    return (
      <Fragment>
        <FixedSubscribeNavLink />
      </Fragment>
    );
  }

  if (isExploreWatchMode || isVideoDetailPage) {
    return (
      <div className="pointer-events-none fixed right-4 top-4 z-[120] sm:right-6 sm:top-5">
        <div className="pointer-events-auto">
          <MainTopUserMenu compact />
        </div>
      </div>
    );
  }

  const logoClass = `flex shrink-0 items-center gap-2 font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 ${easeNav} ${
    compactEffective ? "text-[12px]" : "text-sm"
  }`;

  return (
    <Fragment>
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 isolate [transform:translateZ(0)] ${
        isHomePage && !compactEffective
          ? "bg-black/55 backdrop-blur-0"
          : "bg-reels-abyss/90 backdrop-blur-sm [html[data-theme='light']_&]:bg-white/95"
      } ${easeNav} ${
        compactEffective
          ? "overflow-visible shadow-[0_8px_24px_-16px_rgba(0,0,0,0.35)] [html[data-theme='light']_&]:shadow-[0_6px_20px_-12px_rgba(0,0,0,0.08)]"
          : "shadow-none"
      }`}
    >
      <div
        className={`mx-auto max-w-[1800px] pl-[max(0.35rem,env(safe-area-inset-left))] pr-[max(0.35rem,env(safe-area-inset-right))] sm:pl-[max(0.55rem,env(safe-area-inset-left))] sm:pr-[max(0.55rem,env(safe-area-inset-right))] lg:pl-[max(0.7rem,env(safe-area-inset-left))] lg:pr-[max(0.7rem,env(safe-area-inset-right))] ${easeNav} ${
          compactEffective ? "pb-1.5 pt-1.5" : "pb-1.5 pt-2"
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
            isVideoDetailPage ? (
              <div className={`flex shrink-0 items-center ${easeLayout}`}>
                <Link href="/" className={`${logoClass} sr-only`}>
                  홈으로 이동
                </Link>
              </div>
            ) : (
              <div className={`flex shrink-0 items-center ${easeLayout}`}>
                <Link href="/" className={`${logoClass} sr-only`}>
                  홈으로 이동
                </Link>
              </div>
            )
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
                <div className="flex w-full min-w-0 flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-5">
                  <Link href="/" className="sr-only">
                    홈으로 이동
                  </Link>
                  <div className="flex w-full min-w-0 flex-1 items-center justify-end gap-2 sm:ml-auto sm:w-auto sm:gap-3">
                    <MainTopUserMenu compact={false} />
                    {!isHomePage && user ? (
                      <Link href="/cart" className={cartNavClass} aria-label="장바구니">
                        <ShoppingCart className="h-4 w-4" strokeWidth={2} aria-hidden />
                      </Link>
                    ) : null}
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
            {showCategoryNav ? (
              showAllCategoriesInline ? (
                <div className={`relative z-20 mt-0 flex min-w-0 flex-1 items-center gap-1.5 pr-1 ${easeNav}`}>
                  <button
                    type="button"
                    onClick={() => scrollCategoryRow(-1)}
                    disabled={!canScrollCategoryLeft}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-zinc-300 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white disabled:cursor-default disabled:opacity-35 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-700"
                    aria-label="이전 카테고리"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                  </button>
                  <nav
                    ref={categoryScrollRef}
                    className="no-scrollbar flex min-w-0 flex-1 items-center justify-start gap-1 overflow-x-auto px-0.5 py-0 sm:gap-1.5"
                    aria-label="카테고리"
                  >
                    {ITEMS.map((item) => {
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={`${categoryPillClass} ${active ? categoryPillActiveClass : ""} ${easeLayout} shrink-0 whitespace-nowrap px-3 py-[9px] text-[13px] sm:px-3.5 sm:py-[9px] sm:text-[14px]`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>
                  <button
                    type="button"
                    onClick={() => scrollCategoryRow(1)}
                    disabled={!canScrollCategoryRight}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-zinc-300 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white disabled:cursor-default disabled:opacity-35 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-700"
                    aria-label="다음 카테고리"
                  >
                    <ChevronRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                  </button>
                </div>
              ) : (
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
                      {COMPACT_PRIMARY.map((item) => {
                        const active = pathname === item.href;
                        return (
                          <Link
                            key={item.label}
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            className={`${categoryPillClass} ${active ? categoryPillActiveClass : ""} ${easeLayout} px-2.5 py-[7px] text-[12px] sm:px-3 sm:py-[7px] sm:text-[13px]`}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
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
                          className={`inline-flex items-center gap-0.5 ${categoryPillClass} ${easeLayout} px-2.5 py-[7px] text-[12px] sm:px-3 sm:py-[7px] sm:text-[13px]`}
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
                                  {COMPACT_MORE.map((item) => {
                                    const active = pathname === item.href;
                                    return (
                                      <Link
                                        key={item.label}
                                        href={item.href}
                                        aria-current={active ? "page" : undefined}
                                        onClick={() => {
                                          cancelHoverClose();
                                          setMoreOpen(false);
                                        }}
                                        className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-2 py-[7px] text-[12px] font-semibold leading-none text-zinc-300 transition-colors duration-200 first:pl-2.5 last:pr-2.5 sm:px-2.5 sm:py-[7px] sm:text-[13px] sm:first:pl-3 sm:last:pr-3 ${easeLayout} hover:bg-white/10 hover:text-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-black ${
                                          active
                                            ? "border border-white/22 bg-white/10 font-extrabold !text-[#ffffff] hover:!text-[#ffffff] [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:font-extrabold [html[data-theme='light']_&]:!text-zinc-950 [html[data-theme='light']_&]:hover:!text-zinc-950"
                                            : "border border-transparent"
                                        }`}
                                      >
                                        {item.label}
                                      </Link>
                                    );
                                  })}
                                </nav>
                              </div>
                            </div>,
                            document.body,
                          )}
                      </div>
                    </>
                  ) : (
                    ITEMS.map((item) => {
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={`${categoryPillClass} ${active ? categoryPillActiveClass : ""} ${easeLayout} px-2.5 py-[7px] text-[12px] sm:px-3 sm:py-[7px] sm:text-[13px]`}
                        >
                          {item.label}
                        </Link>
                      );
                    })
                  )}
                </nav>
              )
            ) : null}
          </div>

          {compactEffective && (
            <div
              className={`relative z-10 mr-1 flex shrink-0 items-center gap-1.5 sm:mr-2 sm:gap-2 lg:mr-2 ${easeLayout}`}
            >
              <MainTopUserMenu compact />
              {!isHomePage && user ? (
                <Link href="/cart" className={cartNavClass} aria-label="장바구니">
                  <ShoppingCart className="h-4 w-4" strokeWidth={2} aria-hidden />
                </Link>
              ) : null}
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

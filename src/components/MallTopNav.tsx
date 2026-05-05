"use client";

import { ChevronDown, ChevronLeft, ChevronRight, Wallet } from "lucide-react";
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
import { SitePreferencesMenu } from "@/components/SitePreferencesMenu";
import { MainTopUserMenu } from "@/components/MainTopUserMenu";
import { ReelsSearchField } from "@/components/ReelsSearchField";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTranslation } from "@/hooks/useTranslation";
import { categoryNavKey } from "@/lib/i18n/dictionaries";

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

const subscribeNavClass =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-reels-cyan/40 bg-reels-cyan/10 text-reels-cyan transition hover:bg-reels-cyan/15 sm:size-10 [html[data-theme='light']_&]:border-reels-cyan/35 [html[data-theme='light']_&]:bg-reels-cyan/10";

/** md 미만: 좌측 레일이 없어서 우측 상단 고정 유지. md+: 레일의 구독 버튼만 사용 */
const subscribeFixedWrap =
  "pointer-events-auto fixed right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.5rem,env(safe-area-inset-top))] z-[45] md:right-6 md:hidden";

function FixedSubscribeNavLink() {
  const pathname = usePathname();
  const { user } = useAuthSession();
  const { t } = useTranslation();
  if (!user || (!pathname.startsWith("/mypage") && !pathname.startsWith("/settings"))) return null;
  return (
    <Link
      href="/subscribe"
      className={`${subscribeNavClass} ${subscribeFixedWrap}`}
      aria-label={t("nav.subscribe.aria")}
      title={t("nav.subscribe.title")}
    >
      <Wallet className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]" strokeWidth={2} aria-hidden />
    </Link>
  );
}

export function MallTopNav() {
  const headerRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const isHomePage = pathname === "/";
  const isShopPage = pathname === "/shop";
  const isVideoDetailPage =
    pathname.startsWith("/video/") && !pathname.endsWith("/customize");
  const isCategoryPage = pathname.startsWith("/category/");
  const isExplorePath =
    pathname === "/explore" || pathname.startsWith("/explore/");
  /** 명예의 전당 · 마이페이지 트리: 상단 검은 헤더바 숨김, 계정·장바구니만 우측 상단 플로팅 */
  const isLeaderboardPath =
    pathname === "/leaderboard" || pathname.startsWith("/leaderboard/");
  const isMypagePath =
    pathname === "/mypage" || pathname.startsWith("/mypage/") || pathname === "/settings" || pathname.startsWith("/settings/");
  const isCartPage = pathname === "/cart";
  const isSellPage = pathname === "/sell";
  /** 탐색/카테고리: 메인에서 스크롤 내린 것과 같은 컴팩트 헤더를 즉시 적용 */
  const compactEffective =
    pathname === "/explore" || isShopPage || isCategoryPage || isVideoDetailPage;
  const [isExploreWatchMode, setIsExploreWatchMode] = useState(false);
  const showCategoryNav = (isShopPage || isCategoryPage) && !isExploreWatchMode;
  const showAllCategoriesInline =
    (isShopPage || isCategoryPage) && !isExploreWatchMode;
  /** 쇼핑·카테고리: 1행 카테고리+계정, 2행 검색 가운데 (탐색 /explore 는 검색·카테고리 가로 유지) */
  const mallStackSearchUnderCategory =
    compactEffective && showCategoryNav;
  const [moreOpen, setMoreOpen] = useState(false);
  const showFloatingChromeOnlyNav =
    isExploreWatchMode ||
    isVideoDetailPage ||
    isLeaderboardPath ||
    isMypagePath ||
    isCartPage ||
    isSellPage;
  const [mallSearchQ, setMallSearchQ] = useState("");
  const [exploreSearchQ, setExploreSearchQ] = useState("");
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

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (showFloatingChromeOnlyNav) {
      document.documentElement.style.setProperty("--header-height", "0px");
    }
  }, [showFloatingChromeOnlyNav]);

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

  if (showFloatingChromeOnlyNav) {
    if (isExplorePath && isExploreWatchMode) {
      return (
        <Fragment>
          <div className="pointer-events-none fixed inset-x-0 top-0 z-[120] md:pl-[var(--reels-rail-w)]">
            <div className="pointer-events-none flex w-full items-center justify-end gap-2 px-4 pt-[max(0.65rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] sm:gap-2.5 sm:px-6 sm:pt-[max(0.75rem,env(safe-area-inset-top))] sm:pr-6">
              <div className="pointer-events-auto shrink-0">
                <ReelsSearchField
                  compact
                  exploreWatchExpand
                  q={exploreSearchQ}
                  setQ={setExploreSearchQ}
                />
              </div>
              <div className="pointer-events-auto shrink-0">
                <MainTopUserMenu floatingExplore />
              </div>
            </div>
          </div>
          <FixedSubscribeNavLink />
        </Fragment>
      );
    }
    return (
      <Fragment>
        <div className="pointer-events-none fixed right-4 top-4 z-[120] sm:right-6 sm:top-5">
          <div className="pointer-events-auto flex flex-row items-center gap-2 sm:gap-2">
            <MainTopUserMenu />
          </div>
        </div>
        <FixedSubscribeNavLink />
      </Fragment>
    );
  }

  const logoClass = `flex shrink-0 items-center gap-2 font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 ${easeNav} ${
    compactEffective ? "text-[12px]" : "text-sm"
  }`;

  const compactTopUserChromeClass = `relative z-10 mr-1 flex min-w-0 shrink-0 items-center gap-1.5 sm:mr-2 sm:gap-2 lg:mr-2 ${easeLayout}`;

  const categoryNavigation =
    !showCategoryNav ? null : showAllCategoriesInline ? (
      <div
        className={`relative z-20 flex min-w-0 flex-1 items-center gap-1.5 pr-1 ${easeNav}`}
      >
        <button
          type="button"
          onClick={() => scrollCategoryRow(-1)}
          disabled={!canScrollCategoryLeft}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-zinc-300 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white disabled:cursor-default disabled:opacity-35 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-700"
          aria-label={t("nav.categoryPrev")}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        </button>
        <nav
          ref={categoryScrollRef}
          className="no-scrollbar flex min-w-0 flex-1 items-center justify-start gap-1 overflow-x-auto px-0.5 py-0 sm:gap-1.5"
          aria-label={t("nav.category")}
        >
          {ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`${categoryPillClass} ${active ? categoryPillActiveClass : ""} ${easeLayout} shrink-0 whitespace-nowrap px-3 py-[9px] text-[13px] sm:px-3.5 sm:py-[9px] sm:text-[14px]`}
              >
                {t(categoryNavKey(item.href))}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => scrollCategoryRow(1)}
          disabled={!canScrollCategoryRight}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-zinc-300 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white disabled:cursor-default disabled:opacity-35 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-700"
          aria-label={t("nav.categoryNext")}
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
        aria-label={t("nav.category")}
      >
        {compactEffective ? (
          <>
            {COMPACT_PRIMARY.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`${categoryPillClass} ${active ? categoryPillActiveClass : ""} ${easeLayout} px-2.5 py-[7px] text-[12px] sm:px-3 sm:py-[7px] sm:text-[13px]`}
                >
                  {t(categoryNavKey(item.href))}
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
                {t("nav.category")}
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
                        aria-label={t("nav.categoryMore")}
                      >
                        {COMPACT_MORE.map((item) => {
                          const active = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
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
                              {t(categoryNavKey(item.href))}
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
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`${categoryPillClass} ${active ? categoryPillActiveClass : ""} ${easeLayout} px-2.5 py-[7px] text-[12px] sm:px-3 sm:py-[7px] sm:text-[13px]`}
              >
                {t(categoryNavKey(item.href))}
              </Link>
            );
          })
        )}
      </nav>
    );

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
                  {t("nav.homeLogo.aria")}
                </Link>
              </div>
            ) : (
              <div className={`flex shrink-0 items-center ${easeLayout}`}>
                <Link href="/" className={`${logoClass} sr-only`}>
                  {t("nav.homeLogo.aria")}
                </Link>
              </div>
            )
          ) : null}

          {/* 펼침: 로고 좌 | 검색 우 / 컴팩트 시 접힘 — 펼침 시 overflow-visible (계정 호버 메뉴 잘림 방지) */}
          <div
            className={`w-full ${compactEffective ? "overflow-hidden" : "overflow-visible"} ${easeTitleCollapse} ${
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
                    {t("nav.homeLogo.aria")}
                  </Link>
                  <div className="flex w-full min-w-0 flex-1 items-center justify-end gap-2 sm:ml-auto sm:w-auto sm:gap-3">
                    <MainTopUserMenu />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* 탐색: 검색|카테고리 가로 / 쇼핑·카테고리: 1행 카테고리+계정 · 2행 검색 가운데 */}
          <div
            className={`flex min-h-0 w-full min-w-0 ${easeLayout} ${
              compactEffective
                ? mallStackSearchUnderCategory
                  ? "flex-1 flex-col gap-1 overflow-visible"
                  : "flex-1 flex-row items-center gap-2 overflow-visible sm:gap-3"
                : "flex flex-col"
            }`}
          >
            {isExplorePath && !isExploreWatchMode ? (
              <div className="relative z-20 mt-0 min-w-0 flex-1 pr-1 sm:pr-2">
                <ReelsSearchField
                  compact
                  pinkTrailingSubmit
                  q={exploreSearchQ}
                  setQ={setExploreSearchQ}
                />
              </div>
            ) : null}
            {mallStackSearchUnderCategory ? (
              <>
                <div className="relative z-20 flex w-full min-w-0 flex-row items-center gap-2 overflow-visible sm:gap-3">
                  {categoryNavigation}
                  <div className={compactTopUserChromeClass}>
                    <MainTopUserMenu />
                    <div className="md:hidden">
                      <SitePreferencesMenu />
                    </div>
                  </div>
                </div>
                <div className="flex w-full shrink-0 justify-center px-1">
                  <div className="w-full min-w-0 max-w-2xl">
                    <ReelsSearchField compact q={mallSearchQ} setQ={setMallSearchQ} />
                  </div>
                </div>
              </>
            ) : (
              categoryNavigation
            )}
          </div>

          {compactEffective && !mallStackSearchUnderCategory && (
            <div className={compactTopUserChromeClass}>
              <MainTopUserMenu />
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

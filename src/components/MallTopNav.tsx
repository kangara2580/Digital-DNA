"use client";

import {
  ChevronDown,
  Heart,
  History,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDopamineBasket } from "@/context/DopamineBasketContext";
import { SEARCH_GUIDE_PHRASES, shuffleSearchGuides } from "@/data/searchGuidePhrases";

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

/** 스크롤 컴팩트 시 상단에는 베스트·추천만 노출, 나머지는 「카테고리」 메뉴로 */
const COMPACT_PRIMARY = ITEMS.slice(0, 2);
const COMPACT_MORE = ITEMS.slice(2);

const SCROLL_COMPACT_AT = 56;

/**
 * 레이아웃·폰트·패딩을 2초 넘게 걸면 매 프레임 리플로우·리사이즈 옵저버가 겹쳐 버벅임.
 * GPU 친화 속도(≈520ms) + 블러 제거로 스크롤 역방향 복귀도 프레임 안정화.
 */
const easeLayout =
  "duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-200 motion-reduce:ease-linear";

/** 타이틀 페이드만 살짝 길게 — max-height/opacity는 리플로우 부담 적음 */
const easeTitleFade =
  "duration-[620ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-200 motion-reduce:ease-linear";

const easeNav = `transition-[padding,margin,font-size,line-height,box-shadow,gap,border-color,width,max-width,flex] ${easeLayout}`;

/** 검색창: 마켓형(에츠이 류) 부드러운 배경·테두리·그림자 전환 */
const searchEase =
  "duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:duration-150 motion-reduce:ease-linear";

/** 돋보기 아이콘: 호버/포커스 시 살짝 커지고 기울어지며 뜨는 느낌(마켓 검색 UX) */
const searchIconMotion =
  "origin-[52%_54%] transition-[transform,color] duration-[320ms] ease-[cubic-bezier(0.34,1.15,0.64,1)] motion-reduce:duration-150 motion-reduce:ease-linear " +
  "group-hover:-translate-y-0.5 group-hover:scale-[1.1] group-hover:-rotate-[10deg] group-hover:text-slate-900 " +
  "group-focus-within:-translate-y-0.5 group-focus-within:scale-[1.1] group-focus-within:-rotate-[10deg] group-focus-within:text-slate-900 " +
  "motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:scale-100 motion-reduce:group-hover:rotate-0 " +
  "motion-reduce:group-focus-within:translate-y-0 motion-reduce:group-focus-within:scale-100 motion-reduce:group-focus-within:rotate-0";

const QUICK_MENU = [
  { href: "/recent", label: "최근 본 조각", Icon: History },
  { href: "/wishlist", label: "찜한 조각", Icon: Heart },
  { href: "/cart", label: "장바구니", Icon: ShoppingCart },
  { href: "/mypage", label: "마이페이지", Icon: User },
] as const;

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
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder=""
        autoComplete="off"
        enterKeyHint="search"
        className={`mall-search w-full rounded-full border text-[#000000] outline-none ring-0 transition-[height,padding,font-size,background-color,border-color,box-shadow,color] ${easeLayout} ${searchEase} border-slate-200/90 bg-slate-100/95 placeholder:text-slate-500 hover:border-slate-300 hover:bg-slate-200/90 hover:shadow-[0_2px_14px_-6px_rgba(15,23,42,0.14)] focus:border-slate-400 focus:bg-white focus:shadow-[0_4px_20px_-8px_rgba(15,23,42,0.18)] focus:ring-0 ${
          compact
            ? "h-9 pl-3 pr-10 text-[13px]"
            : "h-11 pl-5 pr-12 text-[14px]"
        }`}
        aria-label={`조각 검색. 안내: ${current}`}
      />
      {showGuide ? (
        <div
          className={`pointer-events-none absolute inset-y-0 left-0 flex items-center overflow-hidden text-left text-slate-500 ${
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
        className={`pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-slate-500 ${
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

function CartChunkMeter({ level }: { level: number }) {
  const slots = 5;
  const filled = Math.min(Math.max(0, level), slots);
  return (
    <span
      className="pointer-events-none absolute -bottom-0.5 left-1/2 flex -translate-x-1/2 gap-[2px]"
      aria-hidden
    >
      {Array.from({ length: slots }, (_, i) => (
        <motion.span
          key={i}
          className="block h-[3px] w-[3.5px] rounded-[1px] bg-slate-700"
          initial={false}
          animate={{
            scale: i < filled ? 1 : 0.35,
            opacity: i < filled ? 1 : 0.12,
            y: i < filled ? 0 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 440,
            damping: 24,
            delay: i * 0.028,
          }}
        />
      ))}
    </span>
  );
}

function QuickMenuIcons({
  className,
  cartAnchorRef,
  cartFillLevel = 0,
}: {
  className?: string;
  cartAnchorRef?: React.RefObject<HTMLAnchorElement | null>;
  cartFillLevel?: number;
}) {
  return (
    <div
      role="group"
      aria-label="나의 활동"
      className={`flex shrink-0 items-center gap-0.5 sm:gap-1 ${className ?? ""}`}
    >
      {QUICK_MENU.map(({ href, label, Icon }) => {
        if (href === "/cart") {
          return (
            <Link
              key={href}
              ref={cartAnchorRef}
              href={href}
              className={`${navActionClass} relative`}
              aria-label={label}
            >
              <motion.span
                key={cartFillLevel}
                className="relative inline-flex flex-col items-center"
                initial={cartFillLevel > 0 ? { scale: 1.12 } : false}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 520,
                  damping: 22,
                }}
              >
                <span
                  data-cart-fly-target
                  className="inline-flex items-center justify-center"
                  aria-hidden
                >
                  <Icon
                    className="h-[20px] w-[20px]"
                    strokeWidth={iconStroke}
                    aria-hidden
                  />
                </span>
                <CartChunkMeter level={cartFillLevel} />
              </motion.span>
            </Link>
          );
        }
        return (
          <Link key={href} href={href} className={navActionClass} aria-label={label}>
            <Icon
              className="h-[20px] w-[20px]"
              strokeWidth={iconStroke}
              aria-hidden
            />
          </Link>
        );
      })}
    </div>
  );
}

export function MallTopNav() {
  const { cartAnchorRef, cartCount } = useDopamineBasket();
  const [q, setQ] = useState("");
  const headerRef = useRef<HTMLElement>(null);
  const [compact, setCompact] = useState(false);
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

    /** 전환 중 연속 리사이즈 → rAF만으로도 매 프레임 --header-height 갱신 → 사이드바·페인트 부담. 짧게 디바운스 */
    const scheduleHeightDebounced = () => {
      window.clearTimeout(debounceT);
      debounceT = window.setTimeout(() => {
        debounceT = 0;
        scheduleHeight();
      }, 56);
    };

    const onScroll = () => {
      const next = window.scrollY > SCROLL_COMPACT_AT;
      setCompact(next);
    };

    const ro = new ResizeObserver(scheduleHeightDebounced);
    ro.observe(el);
    scheduleHeight();
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(debounceT);
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!compact) setMoreOpen(false);
  }, [compact]);

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

  const logoClass = `shrink-0 font-semibold tracking-tight text-[#000000] ${easeNav} ${
    compact ? "text-[13px]" : "text-sm"
  }`;

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 isolate border-b border-slate-200/80 bg-white [transform:translateZ(0)] ${easeNav} ${
        compact ? "overflow-visible shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)]" : "shadow-none"
      }`}
    >
      <div
        className={`mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 ${easeNav} ${
          compact ? "pb-1.5 pt-1" : "pb-2 pt-1"
        }`}
      >
        <div
          className={`flex min-h-0 w-full [contain:layout] ${easeLayout} ${
            compact
              ? "relative flex-row flex-nowrap items-center gap-x-2 overflow-visible sm:gap-x-3"
              : "flex-col"
          }`}
        >
          {/* 로고 줄: 펼침에서만 오른쪽 아이콘 */}
          <div
            className={`flex items-center ${easeLayout} ${
              compact ? "shrink-0" : "w-full justify-between gap-3"
            }`}
          >
            <Link href="/" className={logoClass}>
              디지털 DNA
            </Link>
            {!compact && (
              <QuickMenuIcons
                className="hidden sm:-mr-1 sm:flex lg:-mr-0.5"
                cartAnchorRef={cartAnchorRef}
                cartFillLevel={cartCount}
              />
            )}
          </div>

          {/* 타이틀: grid-rows 대신 max-height+opacity만 전환(레이아웃 계산 부담 감소). 컴팩트 시 absolute로 한 줄 정렬 유지 */}
          <div
            className={`w-full overflow-hidden transition-[max-height,opacity] ${easeTitleFade} ${
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
            className={`flex min-h-0 w-full min-w-0 ${easeLayout} ${
              compact
                ? "flex-1 flex-row items-center gap-2 overflow-visible sm:gap-3"
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
              <RotatingSearchField compact={compact} q={q} setQ={setQ} />
            </div>

            <nav
              className={`flex min-w-0 items-center ${easeNav} ${
                compact
                  ? "mt-0 flex-1 justify-center gap-1 overflow-visible border-0 py-0 sm:gap-1.5"
                  : "no-scrollbar mt-1.5 justify-center gap-1 overflow-x-auto border-t border-slate-100 pt-1.5 sm:gap-1.5"
              }`}
              aria-label="카테고리"
            >
              {compact ? (
                <>
                  {COMPACT_PRIMARY.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`shrink-0 rounded-full bg-transparent font-medium text-slate-800 transition-[background-color,color,padding,font-size] ${easeLayout} hover:bg-slate-100 hover:text-slate-950 px-2 py-1 text-[10px] sm:px-2.5 sm:text-[11px]`}
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
                      className={`inline-flex items-center gap-0.5 rounded-full bg-transparent font-medium text-slate-800 transition-[background-color,color,padding,font-size] ${easeLayout} hover:bg-slate-100 hover:text-slate-950 px-2 py-1 text-[10px] sm:px-2.5 sm:text-[11px]`}
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
                          className="rounded-xl border border-slate-200/95 bg-white shadow-[0_16px_48px_-12px_rgba(15,23,42,0.22)] transition-[opacity,transform] duration-200 ease-out"
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
                                  className={`shrink-0 whitespace-nowrap rounded-full px-1.5 py-1 text-[10px] font-medium text-slate-800 transition-colors duration-200 first:pl-2 last:pr-2 sm:px-2 sm:text-[11px] sm:first:pl-2.5 sm:last:pr-2.5 ${easeLayout} hover:bg-slate-100 hover:text-slate-950`}
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
                    className={`shrink-0 rounded-full bg-transparent font-medium text-slate-800 transition-[background-color,color,padding,font-size] ${easeLayout} hover:bg-slate-100 hover:text-slate-950 px-2.5 py-1.5 text-[11px] sm:px-3 sm:py-2 sm:text-[12px]`}
                  >
                    {item.label}
                  </Link>
                ))
              )}
            </nav>
          </div>

          {compact && (
            <QuickMenuIcons
              className={`shrink-0 sm:-mr-1 lg:-mr-0.5 ${easeLayout}`}
              cartAnchorRef={cartAnchorRef}
              cartFillLevel={cartCount}
            />
          )}
        </div>
      </div>
    </header>
  );
}

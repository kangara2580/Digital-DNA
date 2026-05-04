"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Compass,
  MoreVertical,
  Search,
  Trophy,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SitePreferencesMenu } from "@/components/SitePreferencesMenu";

const stroke = 1.75;

const railIconBtn =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.02] text-zinc-300 transition-[background-color,color,transform] duration-200 hover:bg-white/[0.09] hover:text-zinc-100 active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-black";

const railIconActive =
  "border-0 shadow-none bg-white/[0.02] !text-[color:var(--reels-point)] [&_svg]:!text-[color:var(--reels-point)] hover:bg-white/[0.08] hover:!text-[color:var(--reels-point)] hover:[&_svg]:!text-[color:var(--reels-point)] [html[data-theme='light']_&]:border-0 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:!text-[color:var(--reels-point)] [html[data-theme='light']_&]:[&_svg]:!text-[color:var(--reels-point)] [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:!text-[color:var(--reels-point)] [html[data-theme='light']_&]:hover:[&_svg]:!text-[color:var(--reels-point)]";

const railItemLabelBase =
  "max-w-[3.75rem] text-center text-[10px] font-medium leading-[1.2] tracking-tight [html[data-theme='light']_&]:text-zinc-700";

type RailItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{
    className?: string;
    strokeWidth?: number;
    "aria-hidden"?: boolean;
  }>;
  isActive: (pathname: string) => boolean;
};

function ShopBagOutline({
  className,
  strokeWidth = 1.75,
  ...props
}: React.ComponentProps<"svg"> & { strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
      {...props}
    >
      <path
        d="M5.3 8.8H18.7L17.5 20H6.5L5.3 8.8Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.8 8.8V6.9C8.8 5.1 10.2 3.7 12 3.7C13.8 3.7 15.2 5.1 15.2 6.9V8.8"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.3 15.8H14.7"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const RAIL_ITEMS: RailItem[] = [
  {
    href: "/explore",
    label: "탐색",
    Icon: Compass,
    isActive: (p) => p === "/explore" || p.startsWith("/explore/"),
  },
  {
    href: "/category/best",
    label: "쇼핑몰",
    Icon: ShopBagOutline,
    isActive: (p) =>
      p === "/shop" || p.startsWith("/shop/") || p.startsWith("/category/"),
  },
  {
    href: "/leaderboard",
    label: "순위",
    Icon: Trophy,
    isActive: (p) => p === "/leaderboard" || p.startsWith("/leaderboard/"),
  },
];

export function ReelsLeftRail() {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion() ?? false;
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchPanelPos, setSearchPanelPos] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);
  const drawerTitleId = useId();
  const drawerId = useId();
  const searchBtnRef = useRef<HTMLButtonElement | null>(null);
  const searchPanelRef = useRef<HTMLFormElement | null>(null);
  const searchHoverCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 데스크톱: 호버만으로 검색창 열기 (터치·저사양 포인터는 기존 클릭만) */
  const [searchHoverMode, setSearchHoverMode] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setSearchHoverMode(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const cancelSearchHoverClose = useCallback(() => {
    if (searchHoverCloseTimerRef.current != null) {
      clearTimeout(searchHoverCloseTimerRef.current);
      searchHoverCloseTimerRef.current = null;
    }
  }, []);

  const searchPathActive = pathname === "/search" || pathname.startsWith("/search/");

  const scheduleSearchHoverClose = useCallback(() => {
    if (!searchHoverMode) return;
    cancelSearchHoverClose();
    searchHoverCloseTimerRef.current = setTimeout(() => {
      setSearchOpen(false);
      searchHoverCloseTimerRef.current = null;
    }, 300);
  }, [searchHoverMode, cancelSearchHoverClose]);

  useEffect(() => {
    return () => cancelSearchHoverClose();
  }, [cancelSearchHoverClose]);

  useEffect(() => {
    if (!searchOpen) cancelSearchHoverClose();
  }, [searchOpen, cancelSearchHoverClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const close = useCallback(() => setOpen(false), []);
  const runSearch = useCallback(() => {
    const q = searchQ.trim();
    if (!q) return;
    cancelSearchHoverClose();
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
  }, [router, searchQ, cancelSearchHoverClose]);

  const measureSearchPanel = useCallback(() => {
    const btn = searchBtnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setSearchPanelPos({
      top: r.top + r.height / 2,
      left: r.right + 20,
    });
  }, []);

  useLayoutEffect(() => {
    if (!searchOpen) {
      setSearchPanelPos(null);
      return;
    }
    measureSearchPanel();
    window.addEventListener("resize", measureSearchPanel);
    window.addEventListener("scroll", measureSearchPanel, true);
    return () => {
      window.removeEventListener("resize", measureSearchPanel);
      window.removeEventListener("scroll", measureSearchPanel, true);
    };
  }, [searchOpen, measureSearchPanel]);

  useEffect(() => {
    if (!searchOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const n = e.target as Node;
      if (searchBtnRef.current?.contains(n) || searchPanelRef.current?.contains(n)) return;
      cancelSearchHoverClose();
      setSearchOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cancelSearchHoverClose();
        setSearchOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [searchOpen, cancelSearchHoverClose]);

  return (
    <>
      <aside
        className="fixed inset-y-0 left-0 z-[52] hidden w-[var(--reels-rail-w)] flex-col border-r border-white/[0.08] bg-reels-abyss/80 backdrop-blur-md [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-[1px_0_0_rgba(0,0,0,0.04)] md:flex"
        aria-label="주요 메뉴"
      >
        <div className="relative flex w-full shrink-0 flex-col items-center px-1 pt-[max(0.85rem,env(safe-area-inset-top))] pb-1">
          <Link
            href="/"
            className="mx-auto inline-flex size-[2.625rem] items-center justify-center rounded-full bg-white/[0.14] p-[3px] transition-[opacity,transform,background-color] duration-200 hover:bg-white/[0.19] hover:opacity-95 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 [html[data-theme='light']_&]:size-auto [html[data-theme='light']_&]:mx-0 [html[data-theme='light']_&]:flex [html[data-theme='light']_&]:min-h-[52px] [html[data-theme='light']_&]:w-full [html[data-theme='light']_&]:rounded-[0.85rem] [html[data-theme='light']_&]:bg-transparent [html[data-theme='light']_&]:p-0 [html[data-theme='light']_&]:py-2 [html[data-theme='light']_&]:hover:bg-zinc-900/[0.04] [html[data-theme='light']_&]:active:scale-[0.98]"
            aria-label="홈"
          >
            <img
              src="/brand/rail-home-logo.png"
              alt=""
              className="h-9 w-9 max-w-full object-contain select-none"
              draggable={false}
            />
          </Link>
        </div>
        <div className="flex min-h-0 flex-1 flex-col items-stretch pt-1">
          <nav
            className="flex shrink-0 flex-col items-center gap-2 overflow-visible py-2"
            aria-label="빠른 이동"
          >
            <div
              onMouseEnter={() => {
                if (!searchHoverMode) return;
                cancelSearchHoverClose();
                setSearchOpen(true);
              }}
              onMouseLeave={() => {
                if (!searchHoverMode) return;
                scheduleSearchHoverClose();
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (searchHoverMode) {
                    cancelSearchHoverClose();
                    setSearchOpen(true);
                    return;
                  }
                  setSearchOpen((v) => !v);
                }}
                ref={searchBtnRef}
                className={`${railIconBtn} ${searchPathActive ? railIconActive : ""}`}
                aria-label="검색 열기"
                aria-expanded={searchOpen}
                aria-current={searchPathActive ? "page" : undefined}
              >
                <Search className="h-[23px] w-[23px]" strokeWidth={1.9} aria-hidden />
              </button>
            </div>
            {RAIL_ITEMS.map(({ href, label, Icon, isActive }) => {
              const on = isActive(pathname);
              return (
                <div key={href} className="flex flex-col items-center gap-1">
                  <Link
                    href={href}
                    aria-label={label}
                    aria-current={on ? "page" : undefined}
                    className={`${railIconBtn} ${on ? railIconActive : ""}`}
                  >
                    <Icon
                      className={
                        href === "/category/best" || href === "/shop"
                          ? "h-[31px] w-[31px]"
                          : "h-[25px] w-[25px]"
                      }
                      strokeWidth={stroke}
                      aria-hidden
                    />
                  </Link>
                  <span
                    className={`${railItemLabelBase} ${
                      on
                        ? "text-[color:var(--reels-point)] [html[data-theme='light']_&]:text-[color:var(--reels-point)]"
                        : "text-white/88"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </nav>

          <div className="flex shrink-0 flex-col items-center border-t border-white/[0.06] [html[data-theme='light']_&]:border-zinc-200 px-0 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={`${railIconBtn} text-zinc-400 hover:text-zinc-100 [html[data-theme='light']_&]:text-zinc-900`}
              aria-expanded={open}
              aria-haspopup="dialog"
              aria-controls={drawerId}
              aria-label="더보기 — 언어·화면 테마"
            >
              <MoreVertical className="h-[25px] w-[25px]" strokeWidth={stroke} aria-hidden />
            </button>
          </div>
        </div>
      </aside>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {searchOpen && searchPanelPos ? (
                <motion.form
                  key="rail-search-popover"
                  initial={reduceMotion ? false : { opacity: 0, x: -8, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: 340 }}
                  exit={reduceMotion ? undefined : { opacity: 0, x: -8, width: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  ref={searchPanelRef}
                  onMouseEnter={() => {
                    if (!searchHoverMode) return;
                    cancelSearchHoverClose();
                  }}
                  onMouseLeave={() => {
                    if (!searchHoverMode) return;
                    scheduleSearchHoverClose();
                  }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    runSearch();
                  }}
                  className="fixed z-[260] -translate-y-1/2 overflow-hidden rounded-full border border-white/15 bg-reels-void/95 p-1 shadow-[0_18px_30px_-18px_rgba(0,0,0,0.8)] backdrop-blur-md [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/95"
                  style={{ top: searchPanelPos.top - 20, left: searchPanelPos.left }}
                >
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={searchQ}
                      onChange={(e) => setSearchQ(e.target.value)}
                      placeholder="검색어 입력"
                      className="h-10 w-[312px] min-w-0 bg-transparent pl-4 pr-10 text-[16px] text-zinc-100 outline-none placeholder:text-zinc-500 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:placeholder:text-zinc-500"
                      autoFocus
                      enterKeyHint="search"
                    />
                    {searchQ ? (
                      <button
                        type="button"
                        onClick={() => setSearchQ("")}
                        className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/22 bg-white/[0.06] text-[#E42980] transition hover:border-[rgba(228,41,128,0.55)] hover:bg-white/[0.12] hover:text-[#F56BA5] [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-[#E42980] [html[data-theme='light']_&]:hover:border-[rgba(228,41,128,0.45)] [html[data-theme='light']_&]:hover:bg-zinc-200 [html[data-theme='light']_&]:hover:text-[#C41F6E]"
                        aria-label="검색어 지우기"
                      >
                        <X className="h-[18px] w-[18px]" strokeWidth={2.6} aria-hidden />
                      </button>
                    ) : null}
                  </div>
                </motion.form>
              ) : null}
              {open ? (
                <motion.div
                  key="rail-drawer"
                  className="fixed inset-0 z-[120] md:pl-[var(--reels-rail-w)]"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    type="button"
                    className="absolute inset-0 bg-black/55 backdrop-blur-[2px] [html[data-theme='light']_&]:bg-black/25"
                    aria-label="더보기 닫기"
                    onClick={close}
                  />
                  <motion.div
                    id={drawerId}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={drawerTitleId}
                    className="absolute left-0 top-0 flex h-full w-[min(19rem,calc(100vw-var(--reels-rail-w)))] flex-col border-r border-white/12 bg-reels-void/96 shadow-[8px_0_40px_-12px_rgba(0,0,0,0.85)] backdrop-blur-xl [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-[8px_0_40px_-16px_rgba(0,0,0,0.12)]"
                    initial={reduceMotion ? false : { x: "-104%" }}
                    animate={{ x: 0 }}
                    exit={reduceMotion ? undefined : { x: "-104%" }}
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 38,
                    }}
                  >
                    <div className="flex items-center justify-between border-b border-white/10 [html[data-theme='light']_&]:border-zinc-200 px-4 py-3 pr-3">
                      <p
                        id={drawerTitleId}
                        className="text-[15px] font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
                      >
                        더보기
                      </p>
                      <button
                        type="button"
                        onClick={close}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-black"
                        aria-label="닫기"
                      >
                        <X className="h-5 w-5" strokeWidth={2} aria-hidden />
                      </button>
                    </div>

                    <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4">
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
                        <SitePreferencesMenu layout="stack" />
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}

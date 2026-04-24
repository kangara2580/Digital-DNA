"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bookmark,
  Compass,
  Heart,
  History,
  Link2,
  MoreVertical,
  Search,
  ShoppingCart,
  Trophy,
  User,
  Wallet,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SitePreferencesMenu } from "@/components/SitePreferencesMenu";
import { ReelsLogo } from "@/components/ReelsLogo";
import { useDopamineBasket } from "@/context/DopamineBasketContext";
import { MALL_CATEGORY_NAV_ITEMS } from "@/data/mallCategoryNav";
import { useAuthSession } from "@/hooks/useAuthSession";

const stroke = 1.75;

const railIconBtn =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-zinc-300 transition-[background-color,color,transform,border-color] duration-200 hover:border-white/20 hover:bg-white/[0.09] hover:text-zinc-100 active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-black";

const railIconActive =
  "bg-white/[0.08] text-reels-cyan shadow-[0_0_16px_-4px_rgba(0,242,234,0.35)] [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-reels-cyan";

/** 구독 — 시안 강조(테두리 없음, 글로우·배경만) */
const subscribeRailBtn =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-0 bg-reels-cyan/14 text-reels-cyan shadow-[0_0_24px_-8px_rgba(0,242,234,0.55)] transition-[background-color,box-shadow,transform] duration-200 hover:bg-reels-cyan/22 hover:shadow-[0_0_28px_-6px_rgba(0,242,234,0.65)] active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100 [html[data-theme='light']_&]:bg-reels-cyan/12 [html[data-theme='light']_&]:text-[#0d9488]";

const railTooltip =
  "pointer-events-none absolute left-[calc(100%+0.55rem)] top-1/2 z-[70] -translate-y-1/2 whitespace-nowrap rounded-md border border-white/15 bg-[#070b14]/95 px-2.5 py-1 text-[11px] font-semibold text-zinc-100 opacity-0 shadow-[0_10px_22px_-14px_rgba(0,0,0,0.8)] transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900";

type RailItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  isActive: (pathname: string) => boolean;
};

const RAIL_ITEMS: RailItem[] = [
  {
    href: "/explore",
    label: "탐색",
    Icon: Compass,
    isActive: (p) => p === "/explore" || p.startsWith("/explore/"),
  },
  {
    href: "/leaderboard",
    label: "명예의 전당",
    Icon: Trophy,
    isActive: (p) => p === "/leaderboard" || p.startsWith("/leaderboard/"),
  },
  {
    href: "/likes",
    label: "좋아요한 릴스",
    Icon: Heart,
    isActive: (p) => p.startsWith("/likes"),
  },
  {
    href: "/wishlist",
    label: "찜한 목록",
    Icon: Bookmark,
    isActive: (p) => p.startsWith("/wishlist"),
  },
  {
    href: "/cart",
    label: "장바구니",
    Icon: ShoppingCart,
    isActive: (p) => p.startsWith("/cart"),
  },
  {
    href: "/recent",
    label: "최근 본 릴스",
    Icon: History,
    isActive: (p) => p.startsWith("/recent"),
  },
  {
    href: "/mypage",
    label: "마이페이지",
    Icon: User,
    isActive: (p) => p.startsWith("/mypage"),
  },
];

const DRAWER_QUICK = [
  { href: "/upload/reels", label: "릴스 링크 등록", Icon: Link2 },
] as const;

export function ReelsLeftRail() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartAnchorRef } = useDopamineBasket();
  const { user } = useAuthSession();
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

  const visibleRailItems = RAIL_ITEMS.filter((item) => {
    // 비로그인 사용자는 마이페이지 대신 상단 로그인/회원가입 버튼으로 진입합니다.
    if (item.href === "/mypage" && !user) return false;
    return true;
  });

  useEffect(() => {
    setMounted(true);
  }, []);

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
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
  }, [router, searchQ]);

  const measureSearchPanel = useCallback(() => {
    const btn = searchBtnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setSearchPanelPos({
      top: r.top + r.height / 2,
      left: r.right + 8,
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
      setSearchOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [searchOpen]);

  return (
    <>
      <aside
        className="fixed inset-y-0 left-0 z-[52] hidden w-[var(--reels-rail-w)] flex-col border-r border-white/[0.08] bg-reels-abyss/80 backdrop-blur-md [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-[1px_0_0_rgba(0,0,0,0.04)] md:flex"
        aria-label="주요 메뉴"
      >
        <div className="relative flex shrink-0 flex-col items-center pt-[max(0.85rem,env(safe-area-inset-top))] pb-1">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-200 transition-colors hover:bg-white/[0.07] [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-100"
            aria-label="홈"
          >
            <ReelsLogo size={22} />
          </Link>
        </div>
        <div className="flex min-h-0 flex-1 flex-col items-stretch pt-1">
          <nav
            className="flex shrink-0 flex-col items-center gap-1 overflow-y-auto overflow-x-visible py-2 no-scrollbar"
            aria-label="빠른 이동"
          >
            <div className="group relative">
              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                ref={searchBtnRef}
                className={`${railIconBtn} h-10 w-10`}
                aria-label="검색 열기"
                aria-expanded={searchOpen}
                title="검색"
              >
                <Search className="h-[20px] w-[20px]" strokeWidth={1.9} aria-hidden />
              </button>
              <span className={railTooltip} role="tooltip">
                검색
              </span>
            </div>
            {visibleRailItems.map(({ href, label, Icon, isActive }) => {
              const on = isActive(pathname);
              return (
                <div key={href} className="group relative">
                  <Link
                    href={href}
                    ref={href === "/cart" ? cartAnchorRef : undefined}
                    aria-label={label}
                    aria-current={on ? "page" : undefined}
                    className={`${railIconBtn} ${on ? railIconActive : ""}`}
                    title={label}
                  >
                    <Icon className="h-[22px] w-[22px]" strokeWidth={stroke} aria-hidden />
                  </Link>
                  <span className={railTooltip} role="tooltip">
                    {label}
                  </span>
                </div>
              );
            })}
          </nav>

          {/* 마이페이지 아래~하단 메뉴 위 남는 세로 공간 한가운데 구독 */}
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-0 py-2">
            <div className="group relative">
              <Link
                href="/subscribe"
                className={`${subscribeRailBtn} ${
                  pathname.startsWith("/subscribe")
                    ? "bg-reels-cyan/26 shadow-[0_0_30px_-6px_rgba(0,242,234,0.72)] [html[data-theme='light']_&]:bg-reels-cyan/20"
                    : ""
                }`}
                aria-label="구독·결제 페이지로 이동"
                aria-current={pathname.startsWith("/subscribe") ? "page" : undefined}
                title="구독·크레딧"
              >
                <Wallet className="h-[23px] w-[23px]" strokeWidth={stroke} aria-hidden />
              </Link>
              <span className={railTooltip} role="tooltip">
                구독·크레딧
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center border-t border-white/[0.06] [html[data-theme='light']_&]:border-zinc-200 px-0 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="group relative">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className={`${railIconBtn} text-zinc-400 hover:text-zinc-100 [html[data-theme='light']_&]:text-zinc-900`}
                aria-expanded={open}
                aria-haspopup="dialog"
                aria-controls={drawerId}
                aria-label="더보기 — 언어·화면 테마·메뉴"
                title="더보기"
              >
                <MoreVertical className="h-[22px] w-[22px]" strokeWidth={stroke} aria-hidden />
              </button>
              <span className={railTooltip} role="tooltip">
                더보기
              </span>
            </div>
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
                  animate={{ opacity: 1, x: 0, width: 300 }}
                  exit={reduceMotion ? undefined : { opacity: 0, x: -8, width: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  ref={searchPanelRef}
                  onSubmit={(e) => {
                    e.preventDefault();
                    runSearch();
                  }}
                  className="fixed z-[260] overflow-hidden rounded-full border border-white/15 bg-reels-void/95 p-1 shadow-[0_18px_30px_-18px_rgba(0,0,0,0.8)] backdrop-blur-md [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/95"
                  style={{ top: searchPanelPos.top - 1, left: searchPanelPos.left }}
                >
                  <div className="relative flex items-center">
                    <input
                      type="search"
                      value={searchQ}
                      onChange={(e) => setSearchQ(e.target.value)}
                      placeholder="검색어 입력"
                      className="h-8 w-[240px] min-w-0 bg-transparent pl-3 pr-11 text-[12px] text-zinc-100 outline-none placeholder:text-zinc-500 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:placeholder:text-zinc-500"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="absolute right-0.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-zinc-200 transition hover:border-reels-cyan/40 hover:text-white [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-700"
                      aria-label="검색 실행"
                    >
                      <Search className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </button>
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

                    <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
                        <SitePreferencesMenu layout="stack" />
                      </div>
                      <div>
                        <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                          바로가기
                        </p>
                        <ul className="flex flex-col gap-0.5">
                          {DRAWER_QUICK.map(({ href, label, Icon }) => (
                            <li key={href}>
                              <Link
                                href={href}
                                onClick={close}
                                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-zinc-200 transition-colors hover:bg-white/[0.06] hover:text-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-black"
                              >
                                <Icon
                                  className="h-[18px] w-[18px] shrink-0 text-zinc-400 [html[data-theme='light']_&]:text-zinc-900"
                                  strokeWidth={2}
                                  aria-hidden
                                />
                                {label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                          카테고리
                        </p>
                        <ul className="flex flex-col gap-0.5">
                          {MALL_CATEGORY_NAV_ITEMS.map(({ href, label }) => (
                            <li key={href}>
                              <Link
                                href={href}
                                onClick={close}
                                className="block rounded-xl px-3 py-2 text-[13px] font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-black"
                              >
                                {label}
                              </Link>
                            </li>
                          ))}
                        </ul>
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

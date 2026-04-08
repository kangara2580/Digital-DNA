"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Compass,
  Heart,
  History,
  Home,
  Link2,
  Menu,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { MALL_CATEGORY_NAV_ITEMS } from "@/data/mallCategoryNav";

const stroke = 1.75;

const railIconBtn =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-[background-color,color,transform] duration-200 hover:bg-white/[0.07] hover:text-zinc-100 active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100";

const railIconActive =
  "bg-white/[0.08] text-reels-cyan shadow-[0_0_16px_-4px_rgba(0,242,234,0.35)]";

type RailItem = {
  href: string;
  label: string;
  Icon: typeof Home;
  isActive: (pathname: string) => boolean;
};

const RAIL_ITEMS: RailItem[] = [
  {
    href: "/",
    label: "홈",
    Icon: Home,
    isActive: (p) => p === "/",
  },
  {
    href: "/category/recommend",
    label: "탐색",
    Icon: Compass,
    isActive: (p) => p.startsWith("/category/recommend"),
  },
  {
    href: "/wishlist",
    label: "찜",
    Icon: Heart,
    isActive: (p) => p.startsWith("/wishlist"),
  },
  {
    href: "/cart",
    label: "장바구니",
    Icon: ShoppingCart,
    isActive: (p) => p.startsWith("/cart"),
  },
];

const DRAWER_QUICK = [
  { href: "/recent", label: "최근 본 조각", Icon: History },
  { href: "/upload/reels", label: "릴스 링크 등록", Icon: Link2 },
  { href: "/mypage", label: "마이페이지", Icon: User },
] as const;

export function ReelsLeftRail() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion() ?? false;
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const drawerTitleId = useId();
  const drawerId = useId();

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

  return (
    <>
      <aside
        className="fixed inset-y-0 left-0 z-[38] hidden w-[var(--reels-rail-w)] flex-col border-r border-white/[0.08] bg-reels-abyss/80 backdrop-blur-md md:flex"
        aria-label="주요 메뉴"
      >
        <div className="flex min-h-0 flex-1 flex-col items-center pt-[max(0.75rem,env(safe-area-inset-top))]">
          <nav
            className="flex flex-1 flex-col items-center gap-1 overflow-y-auto overflow-x-hidden py-2 no-scrollbar"
            aria-label="빠른 이동"
          >
            {RAIL_ITEMS.map(({ href, label, Icon, isActive }) => {
              const on = isActive(pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  aria-label={label}
                  aria-current={on ? "page" : undefined}
                  className={`${railIconBtn} ${on ? railIconActive : ""}`}
                >
                  <Icon className="h-[22px] w-[22px]" strokeWidth={stroke} aria-hidden />
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 flex-col items-center border-t border-white/[0.06] px-0 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={`${railIconBtn} text-zinc-400 hover:text-zinc-100`}
              aria-expanded={open}
              aria-haspopup="dialog"
              aria-controls={drawerId}
              title="메뉴"
            >
              <Menu className="h-[22px] w-[22px]" strokeWidth={stroke} aria-hidden />
            </button>
          </div>
        </div>
      </aside>

      {mounted
        ? createPortal(
            <AnimatePresence>
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
                    className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                    aria-label="메뉴 닫기"
                    onClick={close}
                  />
                  <motion.div
                    id={drawerId}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={drawerTitleId}
                    className="absolute left-0 top-0 flex h-full w-[min(19rem,calc(100vw-var(--reels-rail-w)))] flex-col border-r border-white/12 bg-reels-void/96 shadow-[8px_0_40px_-12px_rgba(0,0,0,0.85)] backdrop-blur-xl"
                    initial={reduceMotion ? false : { x: "-104%" }}
                    animate={{ x: 0 }}
                    exit={reduceMotion ? undefined : { x: "-104%" }}
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 38,
                    }}
                  >
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 pr-3">
                      <p
                        id={drawerTitleId}
                        className="text-[15px] font-extrabold tracking-tight text-zinc-100"
                      >
                        메뉴
                      </p>
                      <button
                        type="button"
                        onClick={close}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="닫기"
                      >
                        <X className="h-5 w-5" strokeWidth={2} aria-hidden />
                      </button>
                    </div>

                    <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
                      <div>
                        <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                          바로가기
                        </p>
                        <ul className="flex flex-col gap-0.5">
                          {DRAWER_QUICK.map(({ href, label, Icon }) => (
                            <li key={href}>
                              <Link
                                href={href}
                                onClick={close}
                                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-zinc-200 transition-colors hover:bg-white/[0.06] hover:text-white"
                              >
                                <Icon
                                  className="h-[18px] w-[18px] shrink-0 text-zinc-400"
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
                        <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                          카테고리
                        </p>
                        <ul className="flex flex-col gap-0.5">
                          {MALL_CATEGORY_NAV_ITEMS.map(({ href, label }) => (
                            <li key={href}>
                              <Link
                                href={href}
                                onClick={close}
                                className="block rounded-xl px-3 py-2 text-[13px] font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
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

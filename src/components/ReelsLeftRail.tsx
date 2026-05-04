"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Compass, MoreVertical, Trophy, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
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
        className="fixed inset-y-0 left-0 z-[52] hidden w-[var(--reels-rail-w)] flex-col border-r border-white/[0.08] bg-reels-abyss/80 backdrop-blur-md [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-[1px_0_0_rgba(0,0,0,0.04)] md:flex"
        aria-label="주요 메뉴"
      >
        <div className="relative flex w-full shrink-0 flex-col items-center px-1 pt-[max(0.85rem,env(safe-area-inset-top))] pb-1">
          <Link
            href="/"
            className="mx-auto inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/[0.14] p-1 transition-[opacity,transform,background-color] duration-200 hover:bg-white/[0.19] hover:opacity-95 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 [html[data-theme='light']_&]:size-auto [html[data-theme='light']_&]:shrink [html[data-theme='light']_&]:mx-0 [html[data-theme='light']_&]:flex [html[data-theme='light']_&]:min-h-[52px] [html[data-theme='light']_&]:w-full [html[data-theme='light']_&]:rounded-[0.85rem] [html[data-theme='light']_&]:bg-transparent [html[data-theme='light']_&]:p-0 [html[data-theme='light']_&]:py-2 [html[data-theme='light']_&]:hover:bg-zinc-900/[0.04] [html[data-theme='light']_&]:active:scale-[0.98]"
            aria-label="홈"
          >
            <img
              src="/brand/rail-home-logo.png"
              alt=""
              className="h-7 w-7 max-w-full -translate-y-[3px] object-contain object-center select-none [html[data-theme='light']_&]:h-9 [html[data-theme='light']_&]:w-9 [html[data-theme='light']_&]:translate-y-0"
              draggable={false}
            />
          </Link>
        </div>
        <div className="flex min-h-0 flex-1 flex-col items-stretch pt-1">
          <nav
            className="flex shrink-0 flex-col items-center gap-2 overflow-visible py-2"
            aria-label="빠른 이동"
          >
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

          <div className="flex shrink-0 flex-col items-center border-t border-white/[0.06] px-0 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] [html[data-theme='light']_&]:border-zinc-200">
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
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 pr-3 [html[data-theme='light']_&]:border-zinc-200">
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

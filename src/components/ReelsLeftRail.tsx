"use client";

import { Compass, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const stroke = 1.75;

/** 레일 폭(--reels-rail-w) 안에서만 커지도록, 버튼(h-12)에 맞춘 아이콘 크기 */
const railNavIconClass = (href: string) =>
  href === "/category/best" || href === "/shop"
    ? "h-[38px] w-[38px]"
    : "h-[30px] w-[30px]";

const railIconBtn =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.02] text-zinc-300 transition-[background-color,color,transform] duration-200 hover:bg-white/[0.09] hover:text-zinc-100 active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-black";

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
  const isHome = pathname === "/";

  if (isHome) {
    return (
      <aside
        className="pointer-events-none fixed inset-y-0 left-0 z-[52] hidden w-[var(--reels-rail-w)] flex-col bg-transparent md:flex"
        aria-label="주요 메뉴"
      >
        <div className="pointer-events-auto relative flex w-full shrink-0 flex-col items-center px-1 pt-[max(0.85rem,env(safe-area-inset-top))] pb-1">
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
        <div className="pointer-events-none flex min-h-0 flex-1 flex-col items-stretch pt-1 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <nav
            className="pointer-events-auto flex shrink-0 flex-col items-center gap-2 overflow-visible py-2"
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
                      className={railNavIconClass(href)}
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
        </div>
      </aside>
    );
  }

  return (
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
      <div className="flex min-h-0 flex-1 flex-col items-stretch pt-1 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
                    className={railNavIconClass(href)}
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
      </div>
    </aside>
  );
}

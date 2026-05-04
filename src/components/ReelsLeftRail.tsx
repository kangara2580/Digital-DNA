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

/** 아이콘+라벨 한 덩어리: 부모 Link에만 호버 시 반투명 네모 배경 */
const railNavItemLink =
  "group flex w-full max-w-full flex-col items-center gap-1 rounded-xl px-2 py-2 no-underline outline-none transition-[background-color,transform] duration-200 hover:bg-white/[0.08] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:ring-2 focus-visible:ring-[color:var(--reels-point)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--reels-abyss)] [html[data-theme='light']_&]:hover:bg-zinc-100/85";

const railNavItemLinkCurrent =
  "bg-white/[0.05] hover:bg-white/[0.1] [html[data-theme='light']_&]:bg-zinc-100/55 [html[data-theme='light']_&]:hover:bg-zinc-100/90";

const railIconBtn =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-transparent text-zinc-300 transition-[color,transform] duration-200 group-hover:text-zinc-100 group-active:scale-[0.96] motion-reduce:transition-none motion-reduce:group-active:scale-100 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:group-hover:text-black";

const railIconActive =
  "!text-[color:var(--reels-point)] [&_svg]:!text-[color:var(--reels-point)] group-hover:!text-[color:var(--reels-point)] group-hover:[&_svg]:!text-[color:var(--reels-point)] [html[data-theme='light']_&]:!text-[color:var(--reels-point)] [html[data-theme='light']_&]:[&_svg]:!text-[color:var(--reels-point)] [html[data-theme='light']_&]:group-hover:!text-[color:var(--reels-point)] [html[data-theme='light']_&]:group-hover:[&_svg]:!text-[color:var(--reels-point)]";

const railItemLabelBase =
  "max-w-[3.75rem] cursor-pointer text-center text-[10px] font-medium leading-[1.2] tracking-tight transition-colors duration-200 group-hover:text-zinc-100 [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:group-hover:text-zinc-950";

/** 홈 마크 — 윤곽 필터가 img 박스 밖으로 펼쳐지므로 여백·약간 작은 렌더로 상하 클립 방지 */
const railHomeLogoLink =
  "mx-auto inline-flex shrink-0 items-center justify-center overflow-visible rounded-xl bg-transparent p-1.5 transition-[opacity,transform,background-color] duration-200 hover:opacity-90 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 [html[data-theme='light']_&]:mx-0 [html[data-theme='light']_&]:w-full [html[data-theme='light']_&]:justify-center [html[data-theme='light']_&]:rounded-xl [html[data-theme='light']_&]:py-2 [html[data-theme='light']_&]:hover:bg-zinc-900/[0.04]";

const railHomeLogoImg =
  "block h-10 w-10 max-w-full object-contain object-center select-none [filter:url(#reelsRailLogoOutlineDark)] [html[data-theme='light']_&]:[filter:url(#reelsRailLogoOutlineLight)] motion-reduce:filter-none";

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
          <Link href="/" className={railHomeLogoLink} aria-label="홈">
            <img
              src="/brand/rail-home-logo.png"
              alt=""
              className={railHomeLogoImg}
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
                <Link
                  key={href}
                  href={href}
                  aria-current={on ? "page" : undefined}
                  className={`${railNavItemLink} ${on ? railNavItemLinkCurrent : ""}`}
                >
                  <span
                    className={`${railIconBtn} ${on ? railIconActive : ""}`}
                  >
                    <Icon
                      className={railNavIconClass(href)}
                      strokeWidth={stroke}
                      aria-hidden
                    />
                  </span>
                  <span
                    className={`${railItemLabelBase} ${
                      on
                        ? "text-[color:var(--reels-point)] group-hover:text-[color:var(--reels-point)] [html[data-theme='light']_&]:text-[color:var(--reels-point)] [html[data-theme='light']_&]:group-hover:text-[color:var(--reels-point)]"
                        : "text-white/88"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
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
        <Link href="/" className={railHomeLogoLink} aria-label="홈">
          <img
            src="/brand/rail-home-logo.png"
            alt=""
            className={railHomeLogoImg}
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
              <Link
                key={href}
                href={href}
                aria-current={on ? "page" : undefined}
                className={`${railNavItemLink} ${on ? railNavItemLinkCurrent : ""}`}
              >
                <span
                  className={`${railIconBtn} ${on ? railIconActive : ""}`}
                >
                  <Icon
                    className={railNavIconClass(href)}
                    strokeWidth={stroke}
                    aria-hidden
                  />
                </span>
                <span
                  className={`${railItemLabelBase} ${
                    on
                      ? "text-[color:var(--reels-point)] group-hover:text-[color:var(--reels-point)] [html[data-theme='light']_&]:text-[color:var(--reels-point)] [html[data-theme='light']_&]:group-hover:text-[color:var(--reels-point)]"
                      : "text-white/88"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

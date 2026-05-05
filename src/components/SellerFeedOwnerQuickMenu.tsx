"use client";

import {
  BarChart3,
  Bookmark,
  Clapperboard,
  Heart,
  Menu,
  Save,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef } from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTranslation } from "@/hooks/useTranslation";

const ITEM_DEFS = [
  { href: "/mypage?tab=wishlist", tabKey: "wishlist" as const, Icon: Bookmark },
  { href: "/mypage?tab=likes", tabKey: "likes" as const, Icon: Heart },
  { href: "/mypage?tab=purchases", tabKey: "purchases" as const, Icon: ShoppingBag },
  { href: "/mypage?tab=drafts", tabKey: "drafts" as const, Icon: Save },
  { href: "/mypage?tab=listings", tabKey: "listingsShort" as const, Icon: Clapperboard },
  { href: "/mypage?tab=analytics", tabKey: "analytics" as const, Icon: BarChart3 },
] as const;

const triggerClass =
  "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-zinc-100 outline-none transition-[background-color,color] hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--reels-point)]/35 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-200/50 [html[data-theme='light']_&]:focus-visible:ring-reels-crimson/25";

/** 프로필 호버 메뉴(`LoggedInAccountHoverMenu`)와 동일 패널·항목 톤 */
const panelClass =
  "absolute left-0 top-full z-[100] -mt-2 w-max max-w-[calc(100vw-2rem)] origin-top-left overflow-hidden rounded-xl border border-white/[0.16] bg-[rgba(5,8,14,0.96)] pb-1 pt-2 shadow-[0_14px_42px_-12px_rgba(0,0,0,0.75)] backdrop-blur-md motion-reduce:transition-none [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.12)]";

const panelVisibilityClass =
  "invisible pointer-events-none opacity-0 transition-[opacity,visibility] duration-150 ease-out motion-reduce:transition-none group-hover/ownerquick:pointer-events-auto group-hover/ownerquick:visible group-hover/ownerquick:opacity-100 group-focus-within/ownerquick:pointer-events-auto group-focus-within/ownerquick:visible group-focus-within/ownerquick:opacity-100";

const linkClass =
  "flex items-center gap-2 whitespace-nowrap px-3.5 py-2.5 text-left text-[13px] font-semibold text-zinc-100 transition-colors hover:bg-white/[0.08] [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-100";

const iconClass =
  "h-4 w-4 shrink-0 text-zinc-400 [html[data-theme='light']_&]:text-zinc-500";

/** 내 피드 상단 — 마이페이지 주요 탭으로 바로가기(본인만) */
export function SellerFeedOwnerQuickMenu({ sellerId }: { sellerId: string }) {
  const { user, loading } = useAuthSession();
  const { t } = useTranslation();
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnId = useId();
  const menuId = useId();

  const items = useMemo(
    () =>
      ITEM_DEFS.map((d) => ({
        ...d,
        label: t(`mypage.tab.${d.tabKey}`),
      })),
    [t],
  );

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      const el = document.activeElement;
      if (el && wrapRef.current?.contains(el)) (el as HTMLElement).blur();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const el = document.activeElement;
      if (el && wrapRef.current?.contains(el)) (el as HTMLElement).blur();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (loading || !user?.id || user.id !== sellerId) return null;

  return (
    <div className="group/ownerquick relative w-fit shrink-0" ref={wrapRef}>
      <button
        type="button"
        id={btnId}
        className={triggerClass}
        aria-label={t("seller.menu.aria")}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={(e) => e.currentTarget.focus()}
      >
        <Menu className="h-5 w-5" strokeWidth={2.25} aria-hidden />
      </button>
      <ul
        id={menuId}
        role="menu"
        aria-labelledby={btnId}
        className={`${panelClass} ${panelVisibilityClass}`}
      >
        {items.map(({ href, label, Icon }) => (
          <li key={href} role="none">
            <Link role="menuitem" href={href} className={linkClass}>
              <Icon className={iconClass} strokeWidth={2} aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

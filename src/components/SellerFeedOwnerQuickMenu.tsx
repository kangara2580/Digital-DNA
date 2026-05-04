"use client";

import {
  BarChart3,
  Bookmark,
  Clapperboard,
  Heart,
  Menu,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useAuthSession } from "@/hooks/useAuthSession";

const ITEMS = [
  { href: "/mypage?tab=wishlist", label: "찜 목록", Icon: Bookmark },
  { href: "/mypage?tab=likes", label: "좋아요한 동영상", Icon: Heart },
  { href: "/mypage?tab=drafts", label: "임시 저장", Icon: Save },
  { href: "/mypage?tab=listings", label: "영상 관리", Icon: Clapperboard },
  { href: "/mypage?tab=analytics", label: "판매 분석", Icon: BarChart3 },
] as const;

const triggerClass =
  "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-black/30 text-zinc-100 outline-none transition-[border-color,background-color,color] hover:border-white/40 hover:bg-white/[0.08] focus-visible:border-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--reels-point)]/35 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:border-zinc-400 [html[data-theme='light']_&]:focus-visible:ring-reels-crimson/25";

const panelClass =
  "absolute right-0 top-full z-[100] mt-1 min-w-[15rem] max-w-[calc(100vw-2rem)] rounded-lg border border-white/12 bg-[#121214]/98 py-1 shadow-[0_14px_48px_-10px_rgba(0,0,0,0.85)] backdrop-blur-md [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-lg";

const linkClass =
  "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-medium text-zinc-200 transition-colors hover:bg-white/[0.06] hover:text-zinc-50 [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-zinc-950";

const iconClass =
  "h-4 w-4 shrink-0 text-zinc-500 [html[data-theme='light']_&]:text-zinc-500";

/** 내 피드 상단 — 마이페이지 주요 탭으로 바로가기(본인만) */
export function SellerFeedOwnerQuickMenu({ sellerId }: { sellerId: string }) {
  const { user, loading } = useAuthSession();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnId = useId();
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (loading || !user?.id || user.id !== sellerId) return null;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        id={btnId}
        className={triggerClass}
        aria-label="내 찜·좋아요·임시저장·영상관리·판매분석 바로가기"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <Menu className="h-5 w-5" strokeWidth={2.25} aria-hidden />
      </button>
      {open ? (
        <ul
          id={menuId}
          role="menu"
          aria-labelledby={btnId}
          className={panelClass}
        >
          {ITEMS.map(({ href, label, Icon }) => (
            <li key={href} role="none">
              <Link
                role="menuitem"
                href={href}
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                <Icon className={iconClass} strokeWidth={2} aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

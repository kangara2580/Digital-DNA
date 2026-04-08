"use client";

import { Bell } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DEMO_SELLER_ID } from "@/lib/demoSeller";
import {
  PriceSuggestionModal,
  type PriceSuggestionPayload,
} from "@/components/PriceSuggestionModal";

const navActionClass =
  "inline-flex items-center justify-center rounded-full bg-transparent px-2.5 py-1.5 text-white/80 transition-[background-color,color] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/10 hover:text-white motion-reduce:duration-250";

type ApiNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  status: string;
  oldPrice: number;
  newPrice: number;
  createdAt: string;
  video: { id: string; title: string; poster: string; price: number };
};

export function SellerNotificationBell({ compact }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [modalItem, setModalItem] = useState<PriceSuggestionPayload | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/notifications?sellerId=${encodeURIComponent(DEMO_SELLER_ID)}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        notifications: ApiNotification[];
        unreadPending: number;
      };
      setItems(data.notifications ?? []);
      setUnread(data.unreadPending ?? 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 60000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown, true);
    return () => document.removeEventListener("mousedown", onDown, true);
  }, [open]);

  const openSuggestModal = (n: ApiNotification) => {
    if (n.type !== "PRICE_SUGGEST" || n.status !== "PENDING") return;
    setModalItem({
      id: n.id,
      title: n.title,
      body: n.body,
      oldPrice: n.oldPrice,
      newPrice: n.newPrice,
      videoTitle: n.video.title,
      poster: n.video.poster,
    });
    setOpen(false);
  };

  return (
    <>
      <div ref={wrapRef} className="relative">
        <button
          type="button"
          className={`${navActionClass} relative`}
          aria-label={`판매자 알림${unread > 0 ? `, 미확인 ${unread}건` : ""}`}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <Bell
            className={compact ? "h-[18px] w-[18px]" : "h-[20px] w-[20px]"}
            strokeWidth={1.25}
            aria-hidden
          />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-reels-crimson px-[3px] text-[9px] font-bold leading-none text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </button>
        {open && mounted ? (
          <div
            className="absolute right-0 top-[calc(100%+6px)] z-[9998] w-[min(calc(100vw-24px),320px)] rounded-xl border border-white/15 bg-reels-void/95 py-1 shadow-[0_16px_48px_-12px_rgba(155,109,255,0.2)] backdrop-blur-xl [html[data-theme='light']_&]:border-black/10 [html[data-theme='light']_&]:bg-white/95 [html[data-theme='light']_&]:shadow-[0_16px_48px_-18px_rgba(90,62,127,0.28)]"
            role="menu"
          >
            <p className="border-b border-white/10 px-3 py-2 text-[12px] font-bold text-zinc-100 [html[data-theme='light']_&]:border-black/10 [html[data-theme='light']_&]:text-[#2a1740]">
              알림
            </p>
            <ul className="max-h-[min(50vh,320px)] overflow-y-auto">
              {items.length === 0 ? (
                <li className="px-3 py-4 text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-[#6f5a8b]">알림이 없어요.</li>
              ) : (
                items.map((n) => (
                  <li key={n.id} className="border-b border-white/5 last:border-0 [html[data-theme='light']_&]:border-black/5">
                    <button
                      type="button"
                      className="w-full px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06] [html[data-theme='light']_&]:hover:bg-[#9b6dff]/10 disabled:opacity-50"
                      disabled={n.type !== "PRICE_SUGGEST" || n.status !== "PENDING"}
                      onClick={() => openSuggestModal(n)}
                    >
                      <span className="line-clamp-1 text-[13px] font-semibold text-zinc-100 [html[data-theme='light']_&]:text-[#2a1740]">
                        {n.title}
                      </span>
                      <span className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-zinc-500 [html[data-theme='light']_&]:text-[#6f5a8b]">
                        {n.body}
                      </span>
                      {n.status === "ACCEPTED" ? (
                        <span className="mt-1 inline-block text-[11px] text-emerald-600">
                          수락 완료 · 끌올됨
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : null}
      </div>
      {mounted
        ? createPortal(
            <PriceSuggestionModal
              open={modalItem != null}
              item={modalItem}
              sellerId={DEMO_SELLER_ID}
              onClose={() => setModalItem(null)}
              onAccepted={() => void load()}
            />,
            document.body,
          )
        : null}
    </>
  );
}

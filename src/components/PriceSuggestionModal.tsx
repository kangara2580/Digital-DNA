"use client";

import { useCallback, useEffect, useState } from "react";
import { sanitizePosterSrc } from "@/lib/videoPoster";

export type PriceSuggestionPayload = {
  id: string;
  title: string;
  body: string;
  oldPrice: number;
  newPrice: number;
  videoTitle: string;
  poster: string | null;
};

type Props = {
  open: boolean;
  item: PriceSuggestionPayload | null;
  sellerId: string;
  onClose: () => void;
  onAccepted: () => void;
};

export function PriceSuggestionModal({
  open,
  item,
  sellerId,
  onClose,
  onAccepted,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const accept = useCallback(async () => {
    if (!item) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/notifications/${item.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "요청에 실패했어요.");
      }
      onAccepted();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 났어요.");
    } finally {
      setLoading(false);
    }
  }, [item, onAccepted, onClose, sellerId]);

  if (!open || !item) return null;
  const posterSrc = sanitizePosterSrc(item.poster);

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="price-suggest-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]"
        aria-label="닫기"
        onClick={onClose}
      />
      <div className="relative z-[1] flex max-h-[min(92dvh,calc(100dvh-1.5rem))] w-full max-w-md min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/95 bg-white shadow-[0_24px_64px_-20px_rgba(15,23,42,0.35)]">
        <div className="shrink-0 border-b border-slate-100 px-5 pb-3 pt-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            Digital DNA · 판매자
          </p>
          <h2
            id="price-suggest-title"
            className="mt-1 break-words text-lg font-bold tracking-tight text-slate-900"
          >
            {item.title}
          </h2>
          <p className="mt-1 break-words text-[13px] text-slate-600">{item.videoTitle}</p>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden overscroll-contain px-5 py-4">
          {posterSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={posterSrc}
              alt=""
              className="aspect-video w-full rounded-xl object-cover"
            />
          ) : null}
          <p className="break-words text-[14px] leading-relaxed text-slate-800">{item.body}</p>
          <div className="flex flex-wrap items-baseline gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
            <span className="text-[13px] text-slate-500 line-through tabular-nums">
              {item.oldPrice.toLocaleString("ko-KR")}원
            </span>
            <span className="text-[15px] font-bold tabular-nums text-slate-900">
              → {item.newPrice.toLocaleString("ko-KR")}원 제안
            </span>
          </div>
          {error ? (
            <p className="text-[13px] text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="order-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[14px] font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:order-1"
            onClick={onClose}
            disabled={loading}
          >
            나중에
          </button>
          <button
            type="button"
            className="order-1 rounded-full bg-slate-900 px-4 py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:order-2"
            onClick={() => void accept()}
            disabled={loading}
          >
            {loading ? "반영 중…" : "수락하고 끌올하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

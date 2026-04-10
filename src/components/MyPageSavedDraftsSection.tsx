"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePurchasedVideos } from "@/context/PurchasedVideosContext";
import { SAMPLE_VIDEOS } from "@/data/videos";
import {
  readSavedCustomizeDraftIndex,
  type SavedCustomizeDraftItem,
} from "@/lib/customizeDraftIndex";

export function MyPageSavedDraftsSection() {
  const [items, setItems] = useState<SavedCustomizeDraftItem[]>([]);
  const { hasPurchased, markPurchased } = usePurchasedVideos();

  useEffect(() => {
    const load = () => setItems(readSavedCustomizeDraftIndex());
    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, []);

  const cards = useMemo(
    () =>
      items
        .map((x) => {
          const video = SAMPLE_VIDEOS.find((v) => v.id === x.videoId);
          if (!video) return null;
          return { ...x, video };
        })
        .filter((x): x is { videoId: string; savedAt: number; video: (typeof SAMPLE_VIDEOS)[number] } => x !== null),
    [items],
  );

  return (
    <section className="mt-8 reels-glass-card rounded-2xl p-5 sm:p-6">
      <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
        임시 저장한 편집
      </h2>
      <p className="mt-2 text-[13px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
        창작 스튜디오에서 임시 저장한 설정입니다. 여기서 바로 구매(데모) 후 창작으로 이동할 수 있어요.
      </p>
      {cards.length === 0 ? (
        <p className="mt-4 text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">아직 임시 저장한 항목이 없어요.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {cards.map(({ videoId, savedAt, video }) => {
            const owned = hasPurchased(video.id);
            return (
              <li key={`${videoId}-${savedAt}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 p-3 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={video.poster} alt="" className="h-14 w-14 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">{video.title}</p>
                  <p className="text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                    {new Date(savedAt).toLocaleString("ko-KR")} 저장
                  </p>
                </div>
                {!owned ? (
                  <button
                    type="button"
                    onClick={() => markPurchased(video.id)}
                    className="rounded-lg border border-reels-crimson/40 bg-reels-crimson/15 px-3 py-1.5 text-[11px] font-semibold text-reels-crimson hover:bg-reels-crimson/22"
                  >
                    바로 구매(데모)
                  </button>
                ) : null}
                <Link
                  href={`/video/${video.id}/customize`}
                  className="rounded-lg border border-reels-cyan/40 bg-reels-cyan/12 px-3 py-1.5 text-[11px] font-semibold text-reels-cyan hover:bg-reels-cyan/18"
                >
                  이어서 편집
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { usePurchasedVideos } from "@/context/PurchasedVideosContext";
import { getMarketVideoById } from "@/data/videoCommerce";
import type { FeedVideo } from "@/data/videos";
import {
  pruneOrphanCustomizeDraftIndex,
  readSavedCustomizeDraftIndex,
  removeSavedCustomizeDraft,
  type SavedCustomizeDraftItem,
} from "@/lib/customizeDraftIndex";
import {
  readCustomizeDraftSummary,
} from "@/lib/customizeDraftStorage";
import { sanitizePosterSrc } from "@/lib/videoPoster";

function formatSec(s: number): string {
  const t = Math.max(0, s);
  const m = Math.floor(t / 60);
  const r = Math.floor(t % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function MyPageSavedDraftsSection() {
  const [items, setItems] = useState<SavedCustomizeDraftItem[]>([]);
  const [tick, setTick] = useState(0);
  const { hasPurchased, markPurchased } = usePurchasedVideos();

  const reload = useCallback(() => {
    pruneOrphanCustomizeDraftIndex();
    setItems(readSavedCustomizeDraftIndex());
    setTick((n) => n + 1);
  }, []);

  useEffect(() => {
    reload();
    window.addEventListener("focus", reload);
    window.addEventListener("reels-drafts-updated", reload);
    return () => {
      window.removeEventListener("focus", reload);
      window.removeEventListener("reels-drafts-updated", reload);
    };
  }, [reload]);

  const cards = useMemo(() => {
    void tick;
    return items.map((x) => {
      const video = getMarketVideoById(x.videoId);
      const summary = readCustomizeDraftSummary(x.videoId);
      return { ...x, video, summary };
    });
  }, [items, tick]);

  return (
    <section className="mt-8 reels-glass-card rounded-2xl p-5 sm:p-6">
      <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
        임시 저장한 편집
      </h2>
      <p className="mt-2 text-[13px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
        맞춤 리스킨 스튜디오에서 <strong className="font-semibold text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">임시 저장</strong>한 배경·구간·자막 설정이 그대로 이어집니다. 아래에서 내용을 확인한 뒤 이어서 편집하세요.
      </p>
      {cards.length === 0 ? (
        <p className="mt-4 text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          아직 임시 저장한 항목이 없어요. 조각 상세 → 맞춤 리스킨에서 편집 후 &quot;임시 저장&quot;을 눌러 주세요.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {cards.map(({ videoId, savedAt, video, summary }) => (
            <DraftRow
              key={videoId}
              videoId={videoId}
              savedAt={savedAt}
              video={video}
              summary={summary}
              owned={hasPurchased(videoId)}
              onPurchaseDemo={() => markPurchased(videoId)}
              onRemove={() => {
                removeSavedCustomizeDraft(videoId);
                reload();
              }}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function DraftRow({
  videoId,
  savedAt,
  video,
  summary,
  owned,
  onPurchaseDemo,
  onRemove,
}: {
  videoId: string;
  savedAt: number;
  video: FeedVideo | undefined;
  summary: ReturnType<typeof readCustomizeDraftSummary>;
  owned: boolean;
  onPurchaseDemo: () => void;
  onRemove: () => void;
}) {
  const title = video?.title ?? `조각 ${videoId}`;
  const poster = sanitizePosterSrc(video?.poster) ?? "";
  const creator = video?.creator;

  return (
    <li className="rounded-xl border border-white/10 bg-black/25 p-3 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="flex shrink-0 gap-3">
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt="" className="h-20 w-20 rounded-lg object-cover sm:h-[88px] sm:w-[88px]" />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/30 text-[10px] text-zinc-500 sm:h-[88px] sm:w-[88px] [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-100">
              No poster
            </div>
          )}
          <div className="min-w-0 flex-1 sm:hidden">
            <p className="line-clamp-2 text-[14px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
              {title}
            </p>
            <p className="text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              {new Date(savedAt).toLocaleString("ko-KR")} 저장
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="hidden sm:block">
            <p className="line-clamp-2 text-[15px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
              {title}
            </p>
            {creator ? (
              <p className="mt-0.5 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">{creator}</p>
            ) : null}
            <p className="mt-1 text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              {new Date(savedAt).toLocaleString("ko-KR")} 저장
              {!video ? (
                <span className="ml-2 rounded border border-amber-500/35 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200 [html[data-theme='light']_&]:text-amber-900">
                  카탈로그에 없는 ID — 본문만 복원됩니다
                </span>
              ) : null}
            </p>
          </div>

          {summary ? (
            <ul className="space-y-1 rounded-lg border border-white/8 bg-black/20 px-3 py-2 text-[12px] leading-snug text-zinc-300 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-700">
              <li>
                <span className="font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">배경</span>{" "}
                {summary.backgroundMode === "image" ? "이미지 생성" : "영상 유지"}
                {summary.backgroundPrompt.trim() ? (
                  <>
                    {" "}
                    · 키워드: &ldquo;
                    {summary.backgroundPrompt.length > 72
                      ? `${summary.backgroundPrompt.slice(0, 72)}…`
                      : summary.backgroundPrompt}
                    &rdquo;
                  </>
                ) : null}
              </li>
              <li>
                <span className="font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">구간</span>{" "}
                {formatSec(summary.trimStart)} — {formatSec(summary.trimEnd)}
              </li>
              <li>
                <span className="font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">자막 레이어</span>{" "}
                {summary.overlayCount}개
                {summary.nonEmptyOverlayCount > 0
                  ? ` (텍스트 입력 ${summary.nonEmptyOverlayCount}개)`
                  : null}
              </li>
            </ul>
          ) : (
            <p className="text-[12px] text-amber-300/90 [html[data-theme='light']_&]:text-amber-800">
              저장 본문을 찾을 수 없어요. 스튜디오에서 다시 임시 저장해 주세요.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {!owned ? (
              <button
                type="button"
                onClick={onPurchaseDemo}
                className="rounded-lg border border-reels-crimson/40 bg-reels-crimson/15 px-3 py-1.5 text-[11px] font-semibold text-reels-crimson hover:bg-reels-crimson/22"
              >
                바로 구매(데모)
              </button>
            ) : null}
            <Link
              href={`/video/${videoId}/customize`}
              className="rounded-lg border border-reels-cyan/40 bg-reels-cyan/12 px-3 py-1.5 text-[11px] font-semibold text-reels-cyan hover:bg-reels-cyan/18"
            >
              이어서 편집
            </Link>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && !window.confirm("이 임시 저장을 삭제할까요?")) return;
                onRemove();
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-white/12 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-400 transition hover:border-rose-500/35 hover:bg-rose-500/10 hover:text-rose-200 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:text-rose-800"
              aria-label="임시 저장 삭제"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              삭제
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

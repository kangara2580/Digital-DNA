"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { usePurchasedVideos } from "@/context/PurchasedVideosContext";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  deleteCustomizeDraftRemote,
  fetchUserCustomizeDrafts,
} from "@/lib/supabaseUserSync";
import { getMarketVideoById } from "@/data/videoCommerce";
import type { FeedVideo } from "@/data/videos";
import {
  dispatchCustomizeDraftsUpdated,
  summarizeCustomizePayload,
  type CustomizeDraftSummary,
} from "@/lib/customizeDraftStorage";
import { sanitizePosterSrc } from "@/lib/videoPoster";
import { useTranslation } from "@/hooks/useTranslation";

function formatSec(s: number): string {
  const t = Math.max(0, s);
  const m = Math.floor(t / 60);
  const r = Math.floor(t % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

type DraftRow = {
  videoId: string;
  updatedAt: string;
  summary: CustomizeDraftSummary | null;
};

export function MyPageSavedDraftsSection() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [tick, setTick] = useState(0);
  const { hasPurchased, markPurchased } = usePurchasedVideos();
  const { user, supabaseConfigured } = useAuthSession();

  const reload = useCallback(() => {
    if (!user || !supabaseConfigured) {
      setRows([]);
      setTick((n) => n + 1);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setRows([]);
      setTick((n) => n + 1);
      return;
    }
    void fetchUserCustomizeDrafts(supabase, user.id).then((list) => {
      setRows(
        list.map((r) => ({
          videoId: r.video_id,
          updatedAt: r.updated_at,
          summary: summarizeCustomizePayload(r.payload),
        })),
      );
      setTick((n) => n + 1);
    });
  }, [user, supabaseConfigured]);

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
    return rows.map((r) => {
      const video = getMarketVideoById(r.videoId);
      return { ...r, video };
    });
  }, [rows, tick]);

  if (!user) {
    return (
      <p className="text-[13px] text-white/60 [html[data-theme='light']_&]:text-zinc-600">
        {t("drafts.loginHint")}
      </p>
    );
  }

  return (
    <>
      {cards.length === 0 ? (
        <p className="w-full text-center text-[13px] text-white/60 [html[data-theme='light']_&]:text-zinc-600">
          {t("drafts.empty")}
        </p>
      ) : (
        <ul className="space-y-3">
          {cards.map(({ videoId, updatedAt, video, summary }) => (
            <DraftRowView
              key={videoId}
              videoId={videoId}
              updatedAt={updatedAt}
              video={video}
              summary={summary}
              owned={hasPurchased(videoId)}
              onPurchaseDemo={() => markPurchased(videoId)}
              onRemove={() => {
                const supabase = getSupabaseBrowserClient();
                if (supabase && user) {
                  void deleteCustomizeDraftRemote(supabase, user.id, videoId).then(
                    () => {
                      dispatchCustomizeDraftsUpdated();
                      reload();
                    },
                  );
                }
              }}
            />
          ))}
        </ul>
      )}
    </>
  );
}

function DraftRowView({
  videoId,
  updatedAt,
  video,
  summary,
  owned,
  onPurchaseDemo,
  onRemove,
}: {
  videoId: string;
  updatedAt: string;
  video: FeedVideo | undefined;
  summary: CustomizeDraftSummary | null;
  owned: boolean;
  onPurchaseDemo: () => void;
  onRemove: () => void;
}) {
  const { t, locale } = useTranslation();
  const numLocale = locale === "en" ? "en-US" : "ko-KR";
  const title = video?.title ?? t("drafts.videoFallback", { id: videoId });
  const poster = sanitizePosterSrc(video?.poster) ?? "";
  const creator = video?.creator;
  const when = (() => {
    const parsed = Date.parse(updatedAt);
    if (!Number.isFinite(parsed)) return updatedAt;
    return new Date(parsed).toLocaleString(numLocale);
  })();

  return (
    <li className="rounded-xl border border-white/10 bg-black/25 p-3 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="flex shrink-0 gap-3">
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt="" className="h-20 w-20 rounded-lg object-cover sm:h-[88px] sm:w-[88px]" />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/30 text-[10px] text-zinc-500 sm:h-[88px] sm:w-[88px] [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-100">
              {t("drafts.noPoster")}
            </div>
          )}
          <div className="min-w-0 flex-1 sm:hidden">
            <p className="line-clamp-2 text-[14px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
              {title}
            </p>
            <p className="text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              {t("drafts.savedAt", { when })}
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
              {t("drafts.savedAt", { when })}
              {!video ? (
                <span className="ml-2 rounded border border-amber-500/35 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200 [html[data-theme='light']_&]:text-amber-900">
                  {t("drafts.unknownCatalog")}
                </span>
              ) : null}
            </p>
          </div>

          {summary ? (
            <ul className="space-y-1 rounded-lg border border-white/8 bg-black/20 px-3 py-2 text-[12px] leading-snug text-zinc-300 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-700">
              <li>
                <span className="font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                  {t("drafts.summary.background")}
                </span>{" "}
                {summary.backgroundMode === "image"
                  ? t("drafts.summary.bgImage")
                  : t("drafts.summary.bgVideo")}
                {summary.backgroundPrompt.trim() ? (
                  <>
                    {" "}
                    {t("drafts.keywordLead")} &ldquo;
                    {summary.backgroundPrompt.length > 72
                      ? `${summary.backgroundPrompt.slice(0, 72)}…`
                      : summary.backgroundPrompt}
                    &rdquo;
                  </>
                ) : null}
              </li>
              <li>
                <span className="font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                  {t("drafts.summary.segment")}
                </span>{" "}
                {formatSec(summary.trimStart)} — {formatSec(summary.trimEnd)}
              </li>
              <li>
                <span className="font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                  {t("drafts.summary.overlays")}
                </span>{" "}
                {t("drafts.summary.overlayCount", { n: summary.overlayCount })}
                {summary.nonEmptyOverlayCount > 0
                  ? t("drafts.summary.textInputs", { n: summary.nonEmptyOverlayCount })
                  : null}
              </li>
            </ul>
          ) : (
            <p className="text-[12px] text-amber-300/90 [html[data-theme='light']_&]:text-amber-800">
              {t("drafts.parseError")}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {!owned ? (
              <button
                type="button"
                onClick={onPurchaseDemo}
                className="rounded-lg border border-reels-crimson/40 bg-reels-crimson/15 px-3 py-1.5 text-[11px] font-semibold text-reels-crimson hover:bg-reels-crimson/22"
              >
                {t("drafts.buyNow")}
              </button>
            ) : null}
            <Link
              href={`/video/${videoId}/customize`}
              className="rounded-lg border border-reels-cyan/40 bg-reels-cyan/12 px-3 py-1.5 text-[11px] font-semibold text-reels-cyan hover:bg-reels-cyan/18"
            >
              {t("drafts.resume")}
            </Link>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && !window.confirm(t("drafts.deleteConfirm"))) return;
                onRemove();
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-white/12 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-400 transition hover:border-reels-crimson/38 hover:bg-reels-crimson/12 hover:text-[#F3C4D9] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:text-reels-crimson"
              aria-label={t("drafts.deleteAria")}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              {t("drafts.delete")}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

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
  getCustomizeDraftStorageKey,
  summarizeCustomizePayload,
  type CustomizeDraftSummary,
} from "@/lib/customizeDraftStorage";
import { sanitizePosterSrc } from "@/lib/videoPoster";
import { useTranslation } from "@/hooks/useTranslation";
import { MYPAGE_OUTLINE_BTN_MD } from "@/lib/mypageOutlineCta";

const draftRowOutlineMuted =
  "inline-flex items-center justify-center rounded-lg border border-white/15 bg-transparent px-2.5 py-1.5 text-[13px] font-medium text-zinc-300 shadow-none outline-none transition-[border-color,background-color] hover:border-white/40 hover:bg-white/[0.06] focus-visible:outline-none [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:border-zinc-400";

const draftRowOutlinePink =
  "inline-flex items-center justify-center rounded-lg border border-[color:var(--reels-point)] bg-transparent px-2.5 py-1.5 text-[13px] font-medium text-white shadow-none outline-none transition-[background-color] hover:bg-[color:var(--reels-point)]/14 focus-visible:outline-none [html[data-theme='light']_&]:border-[color:var(--reels-point)] [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-[color:var(--reels-point)]/10";

const draftRowIconGhost =
  "inline-flex items-center justify-center rounded-lg border border-white/15 bg-transparent p-1.5 text-zinc-400 shadow-none outline-none transition-[border-color,background-color] hover:border-white/35 hover:bg-white/[0.06] focus-visible:outline-none [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:border-zinc-400";

type DraftRow = {
  videoId: string;
  updatedAt: string;
  summary: CustomizeDraftSummary | null;
};

export function MyPageSavedDraftsSection() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [tick, setTick] = useState(0);
  const { hasPurchased } = usePurchasedVideos();
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
      <p className="text-[15px] text-white/60 [html[data-theme='light']_&]:text-zinc-600">
        {t("drafts.loginHint")}
      </p>
    );
  }

  return (
    <>
      {cards.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[16px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            {t("drafts.empty")}
          </p>
          <Link href="/explore" className={`mt-5 inline-flex ${MYPAGE_OUTLINE_BTN_MD}`}>
            {t("mypage.wishlist.browse")}
          </Link>
        </div>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {cards.map(({ videoId, updatedAt, video }) => (
            <DraftRowView
              key={videoId}
              videoId={videoId}
              updatedAt={updatedAt}
              video={video}
              owned={hasPurchased(videoId)}
              onRemove={() => {
                const supabase = getSupabaseBrowserClient();
                if (supabase && user) {
                  void deleteCustomizeDraftRemote(supabase, user.id, videoId).then(
                    () => {
                      try {
                        localStorage.removeItem(getCustomizeDraftStorageKey(videoId));
                      } catch {
                        /* ignore */
                      }
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
  owned,
  onRemove,
}: {
  videoId: string;
  updatedAt: string;
  video: FeedVideo | undefined;
  owned: boolean;
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
    <li className="flex h-full min-w-0 flex-col gap-3 rounded-xl border border-white/10 bg-black/25 p-3 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
      <div className="flex min-h-0 flex-1 items-start gap-2.5">
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt=""
            className="h-14 w-14 shrink-0 rounded-lg object-cover sm:h-16 sm:w-16"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/30 text-[10px] leading-tight text-zinc-500 sm:h-16 sm:w-16 sm:text-[11px] [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-100">
            {t("drafts.noPoster")}
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="line-clamp-2 text-[14px] font-bold leading-snug text-zinc-100 sm:text-[15px] [html[data-theme='light']_&]:text-zinc-900">
            {title}
          </p>
          {creator ? (
            <p className="line-clamp-1 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              {creator}
            </p>
          ) : null}
          <p className="text-[11px] text-zinc-500 sm:text-[12px] [html[data-theme='light']_&]:text-zinc-600">
            {t("drafts.savedAt", { when })}
          </p>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-end gap-1.5">
        {!owned ? (
          <Link href={`/video/${videoId}`} className={draftRowOutlinePink}>
            {t("drafts.buyNow")}
          </Link>
        ) : null}
        <Link href={`/video/${videoId}/customize`} className={draftRowOutlineMuted}>
          {t("drafts.resume")}
        </Link>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && !window.confirm(t("drafts.deleteConfirm"))) return;
            onRemove();
          }}
          className={draftRowIconGhost}
          aria-label={t("drafts.deleteAria")}
          title={t("drafts.deleteAria")}
        >
          <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
        </button>
      </div>
    </li>
  );
}

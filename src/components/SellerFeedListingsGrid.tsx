"use client";

import { MoreVertical } from "lucide-react";
import { AraDualSpinLogo } from "@/components/AraDualSpinLogo";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { MyListingEditDialog } from "@/components/MyListingEditDialog";
import { TrendingVideoStatsFooter } from "@/components/TrendingVideoStatsFooter";
import { VideoCard } from "@/components/VideoCard";
import type { FeedVideo } from "@/data/videos";
import type { TrendingRankMetrics } from "@/data/trendingStats";
import { getMetricsForVideoDetail } from "@/data/trendingStats";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTranslation } from "@/hooks/useTranslation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { metricsForSellerListingCard } from "@/lib/sellerListingCardMetricsPure";
import { reelActionBtn, reelActionIcon } from "@/lib/videoReelActionStyles";

type Props = {
  sellerId: string;
  isDbSeller: boolean;
  initialVideos: FeedVideo[];
  initialMetricsByVideoId: Record<string, TrendingRankMetrics>;
  /** 상세·탐색과 동일한 `?fromSeller=` 등 (기본: 판매자 피드 쿼리) */
  detailHrefSuffix?: string;
};

export function SellerFeedListingsGrid({
  sellerId,
  isDbSeller,
  initialVideos,
  initialMetricsByVideoId,
  detailHrefSuffix,
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, loading: authLoading } = useAuthSession();
  const [videos, setVideos] = useState<FeedVideo[]>(initialVideos);
  const [metricsByVideoId, setMetricsByVideoId] = useState<
    Record<string, TrendingRankMetrics>
  >(initialMetricsByVideoId);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editing, setEditing] = useState<FeedVideo | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuPanelRef = useRef<HTMLUListElement | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ top: number; right: number } | null>(
    null,
  );

  const isOwner = Boolean(
    !authLoading && user?.id && user.id === sellerId && isDbSeller,
  );

  const videoDetailHref = (id: string) => {
    const suffix =
      detailHrefSuffix ??
      `?fromSeller=${encodeURIComponent(sellerId)}`;
    return `/video/${encodeURIComponent(id)}${suffix}`;
  };

  useEffect(() => {
    setVideos(initialVideos);
    setMetricsByVideoId(initialMetricsByVideoId);
  }, [sellerId, initialVideos, initialMetricsByVideoId]);

  useEffect(() => {
    if (!openMenuId) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuButtonRef.current?.contains(t)) return;
      if (menuPanelRef.current?.contains(t)) return;
      setOpenMenuId(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenuId(null);
    };
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenuId]);

  useLayoutEffect(() => {
    if (!openMenuId || !menuButtonRef.current) {
      setMenuAnchor(null);
      return;
    }
    const r = menuButtonRef.current.getBoundingClientRect();
    setMenuAnchor({ top: r.bottom + 6, right: window.innerWidth - r.right });
  }, [openMenuId]);

  useEffect(() => {
    if (!openMenuId) return;
    const snap = () => {
      if (!menuButtonRef.current) return;
      const r = menuButtonRef.current.getBoundingClientRect();
      setMenuAnchor({ top: r.bottom + 6, right: window.innerWidth - r.right });
    };
    window.addEventListener("scroll", snap, true);
    window.addEventListener("resize", snap);
    return () => {
      window.removeEventListener("scroll", snap, true);
      window.removeEventListener("resize", snap);
    };
  }, [openMenuId]);

  const getToken = useCallback(async (): Promise<string | null> => {
    const supabase = getSupabaseBrowserClient();
    const { data: sessionData } = (await supabase?.auth.getSession()) ?? {
      data: { session: null },
    };
    return sessionData.session?.access_token ?? null;
  }, []);

  const deleteVideo = useCallback(
    async (id: string) => {
      setDeleteError(null);
      const token = await getToken();
      if (!token) {
        setDeleteError(t("listings.errNoSession"));
        return;
      }
      setDeletingId(id);
      try {
        const res = await fetch(`/api/sell/video/${encodeURIComponent(id)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
        };
        if (!res.ok || body.ok !== true) {
          setDeleteError(t("seller.feed.deleteFailed"));
          return;
        }
        setVideos((prev) => prev.filter((v) => v.id !== id));
        setMetricsByVideoId((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setOpenMenuId(null);
        setEditing((e) => (e?.id === id ? null : e));
        router.refresh();
      } catch {
        setDeleteError(t("listings.errNetwork"));
      } finally {
        setDeletingId(null);
      }
    },
    [getToken, router, t],
  );

  const onConfirmDelete = useCallback(
    (video: FeedVideo) => {
      if (deletingId) return;
      if (!window.confirm(t("seller.feed.deleteVideoConfirm"))) {
        return;
      }
      void deleteVideo(video.id);
    },
    [deleteVideo, deletingId, t],
  );

  const openVideo =
    openMenuId != null ? (videos.find((v) => v.id === openMenuId) ?? null) : null;
  const menuBusy = openVideo ? deletingId === openVideo.id : false;

  return (
    <>
      {deleteError ? (
        <p
          className="mb-3 rounded-lg border border-reels-crimson/35 bg-reels-crimson/[0.08] px-3 py-2 text-[14px] text-[#F9ECF3] [html[data-theme='light']_&]:text-zinc-900"
          role="status"
        >
          {deleteError}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {videos.map((video) => {
          const menuOpen = openMenuId === video.id;
          const busy = deletingId === video.id;
          return (
            <div key={`seller-${sellerId}-${video.id}`} className="min-w-0">
              <VideoCard
                video={video}
                reelLayout
                reelStrip
                disableHoverScale
                hideCreatorMeta
                preloadMode="metadata"
                trendingRankCardPrice
                className="h-full min-w-0"
                detailHref={videoDetailHref(video.id)}
                reelHoverRailLead={
                  isOwner ? (
                    <button
                      ref={menuOpen ? menuButtonRef : undefined}
                      type="button"
                      aria-expanded={menuOpen}
                      aria-haspopup="menu"
                      aria-label={t("seller.feed.listingMenuAria")}
                      disabled={busy}
                      className={reelActionBtn}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenMenuId((id) => (id === video.id ? null : video.id));
                      }}
                    >
                      {busy ? (
                        <AraDualSpinLogo size={22} className={reelActionIcon} />
                      ) : (
                        <MoreVertical
                          className={reelActionIcon}
                          strokeWidth={1.5}
                          aria-hidden
                        />
                      )}
                    </button>
                  ) : undefined
                }
                footerExtension={
                  <TrendingVideoStatsFooter
                    hideMetricLabels
                    metrics={
                      isDbSeller
                        ? (metricsByVideoId[video.id] ??
                          metricsForSellerListingCard(video, { revenueWon: 0, likes: 0 }))
                        : getMetricsForVideoDetail(video.id)
                    }
                  />
                }
              />
            </div>
          );
        })}
      </div>

      {openVideo && menuAnchor && typeof document !== "undefined"
        ? createPortal(
            <ul
              ref={menuPanelRef}
              role="menu"
              style={{
                position: "fixed",
                top: menuAnchor.top,
                right: menuAnchor.right,
                zIndex: 10040,
              }}
              className="min-w-[10.5rem] overflow-hidden rounded-xl border border-white/15 bg-zinc-950/95 py-1 text-left shadow-xl backdrop-blur-md [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white"
            >
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full px-3 py-2.5 text-left text-[14px] font-semibold text-zinc-100 hover:bg-white/10 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-100"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenMenuId(null);
                    setEditing(openVideo);
                  }}
                >
                  {t("seller.feed.editVideo")}
                </button>
              </li>
              <li
                role="none"
                className="border-t border-white/10 [html[data-theme='light']_&]:border-zinc-200"
              >
                <button
                  type="button"
                  role="menuitem"
                  disabled={menuBusy}
                  className="flex w-full px-3 py-2.5 text-left text-[14px] font-semibold text-[color:var(--reels-point)] hover:bg-[color:var(--reels-point)]/12 disabled:opacity-40 [html[data-theme='light']_&]:text-[color:var(--reels-point)] [html[data-theme='light']_&]:hover:bg-[color:var(--reels-point)]/10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onConfirmDelete(openVideo);
                  }}
                >
                  {t("seller.feed.deleteVideo")}
                </button>
              </li>
            </ul>,
            document.body,
          )
        : null}

      {editing ? (
        <MyListingEditDialog
          video={editing}
          open
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setVideos((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
            setEditing(null);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Film, Loader2, Trash2 } from "lucide-react";
import { MyListingEditDialog } from "@/components/MyListingEditDialog";
import { VideoCard } from "@/components/VideoCard";
import { useAuthSession } from "@/hooks/useAuthSession";
import {
  SELL_VIDEO_CATEGORY_OPTIONS,
  type SellVideoCategory,
} from "@/lib/sellVideoCategory";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { MYPAGE_OUTLINE_BTN_MD, MYPAGE_OUTLINE_BTN_SM } from "@/lib/mypageOutlineCta";
import type { FeedVideo } from "@/data/videos";
import { useTranslation } from "@/hooks/useTranslation";

export function MyPageMyListingsSection() {
  const { t } = useTranslation();
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [editing, setEditing] = useState<FeedVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"all" | SellVideoCategory>(
    "all",
  );
  const selectAllRef = useRef<HTMLInputElement>(null);

  const categoryCounts = useMemo(() => {
    const counts = new Map<SellVideoCategory, number>();
    SELL_VIDEO_CATEGORY_OPTIONS.forEach((item) => {
      counts.set(item.value, 0);
    });
    videos.forEach((video) => {
      const category = video.category ?? video.listing?.category;
      if (!category) return;
      if (!counts.has(category as SellVideoCategory)) return;
      counts.set(
        category as SellVideoCategory,
        (counts.get(category as SellVideoCategory) ?? 0) + 1,
      );
    });
    return counts;
  }, [videos]);

  const visibleVideos = useMemo(() => {
    if (activeCategory === "all") return videos;
    return videos.filter((video) => {
      const category = video.category ?? video.listing?.category;
      return category === activeCategory;
    });
  }, [videos, activeCategory]);

  const load = useCallback(async () => {
    if (!user || !supabaseConfigured) {
      setVideos([]);
      setLoading(false);
      setError(null);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      setError(t("listings.errClient"));
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setLoading(false);
      setError(t("listings.errNoSession"));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sell/my-videos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await res.json()) as {
        ok?: boolean;
        videos?: FeedVideo[];
        error?: string;
      };
      if (!res.ok || !body.ok || !Array.isArray(body.videos)) {
        setVideos([]);
        setError(
          body.error === "login_required"
            ? t("listings.errLoginRequired")
            : body.error === "invalid_session"
              ? t("listings.errSessionExpired")
              : t("listings.errLoadFailed"),
        );
        return;
      }
      setVideos(body.videos);
    } catch {
      setVideos([]);
      setError(t("listings.errNetwork"));
    } finally {
      setLoading(false);
    }
  }, [user, supabaseConfigured, t]);

  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [authLoading, load]);

  const visibleIds = useMemo(() => visibleVideos.map((v) => v.id), [visibleVideos]);
  const selectedVisibleCount = useMemo(
    () => visibleIds.filter((id) => selectedIds.includes(id)).length,
    [visibleIds, selectedIds],
  );
  const allSelected = visibleVideos.length > 0 && selectedVisibleCount === visibleVideos.length;
  const someSelected = selectedVisibleCount > 0 && selectedVisibleCount < visibleVideos.length;

  useEffect(() => {
    const el = selectAllRef.current;
    if (el) {
      el.indeterminate = someSelected;
    }
  }, [someSelected, allSelected, videos.length]);

  useEffect(() => {
    const idSet = new Set(videos.map((x) => x.id));
    setSelectedIds((prev) => prev.filter((id) => idSet.has(id)));
  }, [videos]);

  const getToken = useCallback(async (): Promise<string | null> => {
    const supabase = getSupabaseBrowserClient();
    const { data: sessionData } = (await supabase?.auth.getSession()) ?? {
      data: { session: null },
    };
    return sessionData.session?.access_token ?? null;
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (visibleVideos.length === 0) return prev;
      const visibleSet = new Set(visibleIds);
      const selectedVisible = prev.filter((id) => visibleSet.has(id)).length;
      if (selectedVisible === visibleVideos.length) {
        return prev.filter((id) => !visibleSet.has(id));
      }
      const next = new Set(prev);
      visibleIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
  }, [visibleIds, visibleVideos.length]);

  const removeFromSelection = useCallback((ids: string[]) => {
    setSelectedIds((prev) => prev.filter((x) => !ids.includes(x)));
  }, []);

  const deleteByIds = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      const token = await getToken();
      if (!token) {
        setError(t("listings.errNoSession"));
        return;
      }
      setDeleteBusy(true);
      setError(null);
      try {
        const results = await Promise.all(
          ids.map(async (id) => {
            const res = await fetch(
              `/api/sell/video/${encodeURIComponent(id)}`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            const body = (await res.json().catch(() => ({}))) as {
              ok?: boolean;
              error?: string;
            };
            return { id, ok: res.ok && body.ok === true, error: body.error };
          }),
        );
        const failed = results.filter((r) => !r.ok);
        const removed = results.filter((r) => r.ok).map((r) => r.id);
        if (removed.length) {
          setVideos((prev) => prev.filter((v) => !removed.includes(v.id)));
          removeFromSelection(removed);
          setEditing((e) => (e && removed.includes(e.id) ? null : e));
        }
        if (failed.length) {
          setError(
            failed.length === ids.length
              ? t("listings.deleteFail")
              : t("listings.deletePartial", { ok: removed.length, fail: failed.length }),
          );
        }
      } catch {
        setError(t("listings.errNetwork"));
      } finally {
        setDeleteBusy(false);
      }
    },
    [getToken, removeFromSelection, t],
  );

  const confirmDeleteSelected = useCallback(() => {
    if (deleteBusy || selectedIds.length === 0) return;
    const n = selectedIds.length;
    if (
      !window.confirm(
        t("listings.deleteConfirm", { n }),
      )
    ) {
      return;
    }
    void deleteByIds([...selectedIds]);
  }, [deleteBusy, selectedIds, deleteByIds, t]);

  if (authLoading) {
    return (
      <div className="flex items-center gap-2 text-[16px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        <span>{t("listings.checkingAccount")}</span>
      </div>
    );
  }

  if (!supabaseConfigured || !user) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
        <p className="text-[16px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          {t("listings.loginGate")}
        </p>
        <Link
          href="/login?redirect=%2Fmypage%3Ftab%3Dlistings"
          className={`mt-4 inline-flex ${MYPAGE_OUTLINE_BTN_SM}`}
        >
          {t("listings.loginCta")}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
        <Loader2 className="h-8 w-8 animate-spin text-[color:var(--reels-point)]" aria-hidden />
        <p className="text-[16px]">{t("listings.loading")}</p>
      </div>
    );
  }

  if (error && videos.length === 0) {
    return (
      <div className="rounded-2xl border border-reels-crimson/38 bg-reels-crimson/12 px-3 py-4 text-[16px] text-[#F3C4D9] [html[data-theme='light']_&]:text-zinc-900">
        {error}
        <button
          type="button"
          onClick={() => void load()}
          className="ml-3 font-semibold text-reels-cyan underline underline-offset-2 hover:text-reels-cyan/90"
        >
          {t("listings.retry")}
        </button>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 px-6 py-14 text-center [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-50">
        <Film className="mx-auto h-10 w-10 text-zinc-500 [html[data-theme='light']_&]:text-zinc-400" aria-hidden />
        <p className="mt-4 text-[17px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">
          {t("listings.empty")}
        </p>
        <Link
          href="/sell"
          className={`mt-6 inline-flex ${MYPAGE_OUTLINE_BTN_MD}`}
        >
          {t("listings.sellCta")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      {error ? (
        <p className="mb-3 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-[15px] text-amber-100 [html[data-theme='light']_&]:text-amber-950">
          {error}
        </p>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[15px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          {t("listings.totalCountVisible", { n: visibleVideos.length })}
          {activeCategory !== "all" ? (
            <span className="ml-1 text-[14px] text-zinc-600 [html[data-theme='light']_&]:text-zinc-500">
              {t("listings.totalWithFilter", { all: videos.length })}
            </span>
          ) : null}
        </p>
        <Link
          href="/sell"
          className="text-[14px] font-semibold text-reels-cyan hover:underline"
        >
          {t("listings.newListing")}
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={`rounded-full border px-3 py-1.5 text-[14px] font-bold transition ${
            activeCategory === "all"
              ? "border-reels-cyan/50 bg-reels-cyan/15 text-reels-cyan"
              : "border-white/15 bg-black/25 text-zinc-400 hover:border-white/25 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-700"
          }`}
        >
          {t("listings.selectAllTab", { n: videos.length })}
        </button>
        {SELL_VIDEO_CATEGORY_OPTIONS.filter(
          (item) => (categoryCounts.get(item.value) ?? 0) > 0,
        ).map((item) => {
          const count = categoryCounts.get(item.value) ?? 0;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setActiveCategory(item.value)}
              className={`rounded-full border px-3 py-1.5 text-[14px] font-bold transition ${
                activeCategory === item.value
                  ? "border-reels-cyan/50 bg-reels-cyan/15 text-reels-cyan"
                  : "border-white/15 bg-black/25 text-zinc-400 hover:border-white/25 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-700"
              }`}
            >
              {t(`nav.cat.${item.value}`)} ({count})
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100/80">
        <label className="inline-flex cursor-pointer select-none items-center gap-2 text-[15px] font-semibold text-zinc-200 [html[data-theme='light']_&]:text-zinc-800">
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            disabled={deleteBusy || videos.length === 0}
            className="h-4 w-4 rounded border-white/30 bg-black/40 text-reels-cyan focus:ring-reels-cyan/40 [html[data-theme='light']_&]:border-zinc-400 [html[data-theme='light']_&]:bg-white"
            aria-label={t("listings.selectAllAria")}
          />
          {t("listings.selectAllAria")}
        </label>
        <span className="hidden h-4 w-px bg-white/15 sm:block [html[data-theme='light']_&]:bg-zinc-300" aria-hidden />
        <button
          type="button"
          disabled={deleteBusy || selectedIds.length === 0}
          onClick={confirmDeleteSelected}
          className="inline-flex items-center gap-1.5 rounded-lg border border-reels-crimson/42 bg-reels-crimson/14 px-3 py-1.5 text-[14px] font-bold text-[#F9ECF3] transition hover:bg-reels-crimson/24 disabled:cursor-not-allowed disabled:opacity-40 [html[data-theme='light']_&]:text-zinc-900"        >
          {deleteBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          )}
          {t("listings.delete")}
          {selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
        </button>
        {selectedIds.length > 0 ? (
          <span className="text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            {t("listings.selectedCount", { n: selectedIds.length })}
          </span>
        ) : (
          <span className="text-[14px] text-zinc-600 [html[data-theme='light']_&]:text-zinc-500">
            {t("listings.selectHint")}
          </span>
        )}
      </div>

      <ul className="grid list-none grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
        {visibleVideos.map((v) => {
          const checked = selectedIds.includes(v.id);
          return (
            <li key={v.id} className="group relative min-w-0">
              <label className="absolute left-1.5 top-1.5 z-[25] flex cursor-pointer items-center justify-center rounded-md border border-white/25 bg-black/70 p-1.5 shadow-md backdrop-blur-sm transition hover:bg-black/85 [html[data-theme='light']_&]:border-zinc-400 [html[data-theme='light']_&]:bg-white/95">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSelect(v.id)}
                  disabled={deleteBusy}
                  className="h-3.5 w-3.5 rounded border-white/35 text-reels-cyan focus:ring-reels-cyan/40 [html[data-theme='light']_&]:border-zinc-400"
                  aria-label={t("listings.selectVideoAria", { title: v.title })}
                />
              </label>
              <VideoCard video={v} className="min-w-0" hideHoverActions />
              <div className="absolute right-1.5 top-1.5 z-[25] flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setEditing(v)}
                  disabled={deleteBusy}
                  className="rounded-lg border border-white/20 bg-black/60 px-2 py-1 text-[12px] font-extrabold uppercase tracking-wide text-white shadow-md backdrop-blur-sm transition hover:bg-black/75 sm:px-2.5 sm:py-1.5 sm:text-[13px]"
                >
                  {t("listings.edit")}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {editing ? (
        <MyListingEditDialog
          video={editing}
          open
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setVideos((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
            setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}

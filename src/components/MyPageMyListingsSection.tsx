"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Film, Loader2, Trash2 } from "lucide-react";
import { MyListingEditDialog } from "@/components/MyListingEditDialog";
import { VideoCard } from "@/components/VideoCard";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getSellVideoCategoryLabel } from "@/lib/sellVideoCategory";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { FeedVideo } from "@/data/videos";

export function MyPageMyListingsSection() {
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [editing, setEditing] = useState<FeedVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

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
      setError("Supabase 클라이언트를 초기화할 수 없습니다.");
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setLoading(false);
      setError("세션이 없습니다. 다시 로그인해 주세요.");
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
            ? "로그인이 필요합니다."
            : body.error === "invalid_session"
              ? "세션이 만료되었습니다. 다시 로그인해 주세요."
              : "목록을 불러오지 못했습니다.",
        );
        return;
      }
      setVideos(body.videos);
    } catch {
      setVideos([]);
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [user, supabaseConfigured]);

  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [authLoading, load]);

  const allSelected =
    videos.length > 0 && selectedIds.length > 0 && selectedIds.length === videos.length;
  const someSelected =
    videos.length > 0 &&
    selectedIds.length > 0 &&
    selectedIds.length < videos.length;

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
      if (videos.length === 0) return [];
      if (prev.length === videos.length) return [];
      return videos.map((x) => x.id);
    });
  }, [videos]);

  const removeFromSelection = useCallback((ids: string[]) => {
    setSelectedIds((prev) => prev.filter((x) => !ids.includes(x)));
  }, []);

  const deleteByIds = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      const token = await getToken();
      if (!token) {
        setError("세션이 없습니다. 다시 로그인해 주세요.");
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
              ? "삭제하지 못했습니다. 다시 시도해 주세요."
              : `${removed.length}개 삭제됨 · ${failed.length}개 실패`,
          );
        }
      } catch {
        setError("네트워크 오류가 발생했습니다.");
      } finally {
        setDeleteBusy(false);
      }
    },
    [getToken, removeFromSelection],
  );

  const confirmDeleteOne = useCallback(
    (v: FeedVideo) => {
      if (deleteBusy) return;
      if (
        !window.confirm(
          `「${v.title}」 영상을 삭제할까요?\n삭제 후에는 복구할 수 없습니다.`,
        )
      ) {
        return;
      }
      void deleteByIds([v.id]);
    },
    [deleteBusy, deleteByIds],
  );

  const confirmDeleteSelected = useCallback(() => {
    if (deleteBusy || selectedIds.length === 0) return;
    const n = selectedIds.length;
    if (
      !window.confirm(
        `선택한 영상 ${n}개를 삭제할까요?\n삭제 후에는 복구할 수 없습니다.`,
      )
    ) {
      return;
    }
    void deleteByIds([...selectedIds]);
  }, [deleteBusy, selectedIds, deleteByIds]);

  if (authLoading) {
    return (
      <div className="flex items-center gap-2 text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        <span>계정 확인 중…</span>
      </div>
    );
  }

  if (!supabaseConfigured || !user) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
        <p className="text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          로그인하면 여기에서 판매로 등록한 영상을 모아 볼 수 있어요.
        </p>
        <Link
          href="/login?redirect=%2Fmypage%3Ftab%3Dlistings"
          className="mt-4 inline-flex rounded-full bg-reels-crimson px-5 py-2.5 text-[14px] font-extrabold text-white shadow-reels-crimson hover:brightness-110"
        >
          로그인
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
        <Loader2 className="h-8 w-8 animate-spin text-reels-cyan/80" aria-hidden />
        <p className="text-[14px]">등록한 영상을 불러오는 중…</p>
      </div>
    );
  }

  if (error && videos.length === 0) {
    return (
      <div className="rounded-2xl border border-rose-500/35 bg-rose-500/10 px-3 py-4 text-[14px] text-rose-200 [html[data-theme='light']_&]:text-rose-900">
        {error}
        <button
          type="button"
          onClick={() => void load()}
          className="ml-3 font-semibold text-reels-cyan underline underline-offset-2 hover:text-reels-cyan/90"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 px-6 py-14 text-center [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-50">
        <Film className="mx-auto h-10 w-10 text-zinc-500 [html[data-theme='light']_&]:text-zinc-400" aria-hidden />
        <p className="mt-4 text-[15px] font-bold text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
          아직 등록한 영상이 없어요
        </p>
        <p className="mt-2 text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          판매 등록 페이지에서 릴스를 올리면 여기에 표시됩니다.
        </p>
        <Link
          href="/sell"
          className="mt-6 inline-flex rounded-full bg-reels-crimson px-6 py-3 text-[14px] font-extrabold text-white shadow-reels-crimson hover:brightness-110"
        >
          판매 등록하기
        </Link>
      </div>
    );
  }

  return (
    <div>
      {error ? (
        <p className="mb-3 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-100 [html[data-theme='light']_&]:text-amber-950">
          {error}
        </p>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          총{" "}
          <strong className="text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
            {videos.length}
          </strong>
          개
        </p>
        <Link
          href="/sell"
          className="text-[12px] font-semibold text-reels-cyan hover:underline"
        >
          새로 등록하기 →
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100/80">
        <label className="inline-flex cursor-pointer select-none items-center gap-2 text-[13px] font-semibold text-zinc-200 [html[data-theme='light']_&]:text-zinc-800">
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            disabled={deleteBusy || videos.length === 0}
            className="h-4 w-4 rounded border-white/30 bg-black/40 text-reels-cyan focus:ring-reels-cyan/40 [html[data-theme='light']_&]:border-zinc-400 [html[data-theme='light']_&]:bg-white"
            aria-label="전체 선택"
          />
          전체 선택
        </label>
        <span className="hidden h-4 w-px bg-white/15 sm:block [html[data-theme='light']_&]:bg-zinc-300" aria-hidden />
        <button
          type="button"
          disabled={deleteBusy || selectedIds.length === 0}
          onClick={confirmDeleteSelected}
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/15 px-3 py-1.5 text-[12px] font-bold text-rose-200 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-40 [html[data-theme='light']_&]:text-rose-900"
        >
          {deleteBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          )}
          선택 삭제
          {selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
        </button>
        {selectedIds.length > 0 ? (
          <span className="text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            {selectedIds.length}개 선택됨
          </span>
        ) : (
          <span className="text-[12px] text-zinc-600 [html[data-theme='light']_&]:text-zinc-500">
            카드 왼쪽 체크로 고른 뒤 삭제할 수 있어요.
          </span>
        )}
      </div>

      <ul className="grid list-none grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
        {videos.map((v) => {
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
                  aria-label={`${v.title} 선택`}
                />
              </label>
              <VideoCard video={v} className="min-w-0" />
              <div className="absolute right-1.5 top-1.5 z-[25] flex flex-col gap-1">
                <span className="max-w-[7.5rem] truncate rounded-md border border-reels-cyan/35 bg-black/70 px-2 py-1 text-center text-[10px] font-bold text-reels-cyan shadow-md backdrop-blur-sm [html[data-theme='light']_&]:border-reels-cyan/45 [html[data-theme='light']_&]:bg-white/95">
                  {getSellVideoCategoryLabel(v.category ?? v.listing?.category)}
                </span>
                <button
                  type="button"
                  onClick={() => setEditing(v)}
                  disabled={deleteBusy}
                  className="rounded-lg border border-white/20 bg-black/60 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-md backdrop-blur-sm transition hover:bg-black/75 sm:px-2.5 sm:py-1.5 sm:text-[11px]"
                >
                  편집
                </button>
                <button
                  type="button"
                  onClick={() => confirmDeleteOne(v)}
                  disabled={deleteBusy}
                  title="이 영상 삭제"
                  aria-label={`${v.title} 삭제`}
                  className="inline-flex items-center justify-center rounded-lg border border-rose-500/45 bg-black/70 p-1.5 text-rose-200 shadow-md backdrop-blur-sm transition hover:bg-rose-950/50 hover:text-white disabled:opacity-40 [html[data-theme='light']_&]:text-rose-800"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
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

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Film, Loader2 } from "lucide-react";
import { MyListingEditDialog } from "@/components/MyListingEditDialog";
import { VideoCard } from "@/components/VideoCard";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { FeedVideo } from "@/data/videos";

export function MyPageMyListingsSection() {
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [editing, setEditing] = useState<FeedVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (error) {
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
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          총 <strong className="text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">{videos.length}</strong>개
        </p>
        <Link
          href="/sell"
          className="text-[12px] font-semibold text-reels-cyan hover:underline"
        >
          새로 등록하기 →
        </Link>
      </div>
      <ul className="grid list-none grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
        {videos.map((v) => (
          <li key={v.id} className="group relative min-w-0">
            <VideoCard video={v} className="min-w-0" />
            <button
              type="button"
              onClick={() => setEditing(v)}
              className="absolute right-1.5 top-1.5 z-10 rounded-lg border border-white/20 bg-black/60 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-md backdrop-blur-sm transition hover:bg-black/75 sm:right-2 sm:top-2 sm:px-2.5 sm:py-1.5 sm:text-[11px]"
            >
              편집
            </button>
          </li>
        ))}
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

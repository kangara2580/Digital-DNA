"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { MyListingEditDialog } from "@/components/MyListingEditDialog";
import type { FeedVideo } from "@/data/videos";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function VideoListingEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const [video, setVideo] = useState<FeedVideo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: sessionData } = (await supabase?.auth.getSession()) ?? {
        data: { session: null },
      };
      const token = sessionData.session?.access_token;
      if (!token) {
        if (!cancelled) setError("login");
        return;
      }
      const res = await fetch(`/api/sell/video/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await res.json()) as {
        ok?: boolean;
        video?: FeedVideo;
        error?: string;
      };
      if (cancelled) return;
      if (!res.ok || !body.ok || !body.video) {
        setError(body.error === "not_found" ? "not_found" : "load");
        return;
      }
      setVideo(body.video);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error === "login") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-[14px] text-zinc-400">
        <p>로그인이 필요합니다.</p>
        <Link
          href={`/login?redirect=${encodeURIComponent(`/video/${id}/edit`)}`}
          className="mt-4 inline-block font-bold text-reels-cyan underline"
        >
          로그인하기
        </Link>
      </div>
    );
  }

  if (error === "not_found" || error === "load") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-[14px] text-zinc-400">
        {error === "not_found"
          ? "이 영상을 찾을 수 없거나 수정 권한이 없습니다."
          : "불러오지 못했습니다."}
        <div className="mt-4">
          <Link href={`/video/${encodeURIComponent(id)}`} className="font-bold text-reels-cyan underline">
            상세로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin text-reels-cyan/80" aria-hidden />
      </div>
    );
  }

  return (
    <MyListingEditDialog
      video={video}
      open
      onClose={() => router.push(`/video/${encodeURIComponent(id)}`)}
      onSaved={(updated) => {
        setVideo(updated);
        router.push(`/video/${encodeURIComponent(id)}`);
        router.refresh();
      }}
    />
  );
}

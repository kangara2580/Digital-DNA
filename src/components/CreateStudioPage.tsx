"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GlobalLoading } from "@/components/GlobalLoading";
import { PurchaseCustomizeStudio } from "@/components/PurchaseCustomizeStudio";
import { MYPAGE_OUTLINE_BTN_MD } from "@/lib/mypageOutlineCta";
import { resolveManualTikTokVideoForStudio } from "@/data/tiktokData";
import { ALL_MARKET_VIDEOS } from "@/data/videoCatalog";
import { getMarketVideoById } from "@/data/videoCommerce";
import type { FeedVideo } from "@/data/videos";

function hasStaticStudioVideo(id: string): boolean {
  return Boolean(getMarketVideoById(id) ?? resolveManualTikTokVideoForStudio(id));
}

/**
 * TEMP(UI 작업용): `?studioUiPreview=1` 이고 `videoId` 가 없을 때 마켓 샘플 클립으로 스튜디오를 연다.
 * — 개발 서버에서는 항상 허용, 프로덕션에서는 `NEXT_PUBLIC_STUDIO_UI_PREVIEW=1` 일 때만 허용.
 * 작업 종료 후 사용자 요청 시 이 블록 전체를 제거하면 원래 동작으로 돌아간다.
 */
function resolveStudioUiPreviewFallbackVideo(): FeedVideo | null {
  return (
    getMarketVideoById("dna-100-asphalt") ??
    getMarketVideoById("micro-100-neon-bokeh") ??
    ALL_MARKET_VIDEOS[0] ??
    null
  );
}

export function CreateStudioPage() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("videoId") ?? "";
  const studioUiPreviewAllowed =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_STUDIO_UI_PREVIEW === "1";
  const studioUiPreviewActive =
    studioUiPreviewAllowed && searchParams.get("studioUiPreview") === "1" && !videoId.trim();
  const previewFallbackVideo = useMemo((): FeedVideo | null => {
    if (!studioUiPreviewActive) return null;
    return resolveStudioUiPreviewFallbackVideo();
  }, [studioUiPreviewActive]);

  const staticVideo = useMemo((): FeedVideo | null => {
    if (!videoId) return null;
    return getMarketVideoById(videoId) ?? resolveManualTikTokVideoForStudio(videoId) ?? null;
  }, [videoId]);

  const [dbVideo, setDbVideo] = useState<FeedVideo | null>(null);
  const [dbState, setDbState] = useState<"idle" | "loading" | "error">(() =>
    videoId && !hasStaticStudioVideo(videoId) ? "loading" : "idle",
  );

  useEffect(() => {
    if (!videoId) {
      setDbVideo(null);
      setDbState("idle");
      return;
    }
    if (staticVideo) {
      setDbVideo(null);
      setDbState("idle");
      return;
    }

    let cancelled = false;
    setDbState("loading");
    setDbVideo(null);

    fetch(`/api/studio/video?videoId=${encodeURIComponent(videoId)}`)
      .then(async (r) => {
        const data = (await r.json()) as { ok?: boolean; video?: FeedVideo; error?: string };
        if (!r.ok) throw new Error(data.error ?? "load_failed");
        if (!data.video) throw new Error("empty");
        return data.video;
      })
      .then((v) => {
        if (cancelled) return;
        setDbVideo(v);
        setDbState("idle");
      })
      .catch(() => {
        if (cancelled) return;
        setDbVideo(null);
        setDbState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [videoId, staticVideo]);

  const video = staticVideo ?? dbVideo;

  if (studioUiPreviewActive && previewFallbackVideo) {
    return <PurchaseCustomizeStudio video={previewFallbackVideo} heroTitle="창작 스튜디오" />;
  }

  if (!videoId) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 px-6 py-14 text-center [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-sm">
        <p className="text-[15px] font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
          선택된 동영상이 없어요
        </p>
        <p className="mt-2 text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          영상 상세에서 「AI 창작하기」를 누르거나, 홈에서 클립을 고르세요.
        </p>
        <Link href="/" className={`mt-8 inline-flex ${MYPAGE_OUTLINE_BTN_MD}`}>
          홈으로
        </Link>
      </div>
    );
  }

  if (!staticVideo && dbState === "loading") {
    return (
      <div className="min-h-[320px] rounded-2xl border border-white/10 bg-zinc-900/40 px-6 py-14 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-sm">
        <GlobalLoading
          size="xl"
          label="동영상 정보를 불러오는 중이에요…"
          className="text-zinc-400 [html[data-theme='light']_&]:text-zinc-600"
        />
      </div>
    );
  }

  if (!staticVideo && dbState === "error") {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 px-6 py-14 text-center [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-sm">
        <p className="text-[15px] font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
          동영상을 불러오지 못했어요
        </p>
        <p className="mt-2 text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          네트워크를 확인하거나, 상세 페이지에서 다시 「AI 창작하기」를 눌러 주세요.
        </p>
        <Link href="/" className={`mt-8 inline-flex ${MYPAGE_OUTLINE_BTN_MD}`}>
          홈으로
        </Link>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 px-6 py-14 text-center [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-sm">
        <p className="text-[15px] font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
          해당 동영상을 찾을 수 없어요
        </p>
        <Link href="/" className={`mt-6 inline-flex ${MYPAGE_OUTLINE_BTN_MD}`}>
          홈으로
        </Link>
      </div>
    );
  }

  return <PurchaseCustomizeStudio video={video} heroTitle="창작 스튜디오" />;
}

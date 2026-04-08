"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { KlingReskinStudio } from "@/components/KlingReskinStudio";
import { usePurchasedVideos } from "@/context/PurchasedVideosContext";
import { getMarketVideoById } from "@/data/videoCommerce";

export function CreateStudioPage() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("videoId") ?? "";
  const { hasPurchased } = usePurchasedVideos();

  const video = useMemo(() => {
    if (!videoId) return undefined;
    return getMarketVideoById(videoId);
  }, [videoId]);

  if (!videoId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-[15px] font-semibold text-zinc-200">선택된 릴스가 없어요</p>
        <p className="mt-2 text-[14px] text-zinc-500">
          영상 상세에서 「AI 창작하기」를 누르거나, 아래에서 클립을 고르세요.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-reels-crimson px-6 py-3 text-[14px] font-extrabold text-white shadow-reels-crimson hover:brightness-110"
        >
          홈으로
        </Link>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-[15px] font-semibold text-zinc-200">해당 조각을 찾을 수 없어요</p>
        <Link href="/" className="mt-6 inline-flex text-reels-cyan hover:underline">
          홈으로
        </Link>
      </div>
    );
  }

  if (!hasPurchased(video.id)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-[17px] font-extrabold text-zinc-100">창작은 모션 권한 구매 후에 열려요</p>
        <p className="mt-3 text-[14px] leading-relaxed text-zinc-500">
          조각 상세에서 「모션 권한 구매(데모)」를 완료하면 「AI 창작하기」가 활성화됩니다.
        </p>
        <Link
          href={`/video/${video.id}`}
          className="mt-8 inline-flex rounded-full bg-reels-crimson px-6 py-3 text-[14px] font-extrabold text-white shadow-reels-crimson hover:brightness-110"
        >
          조각 상세로 이동
        </Link>
      </div>
    );
  }

  return (
    <>
      <nav className="mb-6 font-mono text-[11px] text-zinc-500">
        <Link href="/" className="text-reels-cyan/90 hover:text-reels-cyan">
          홈
        </Link>
        <span className="mx-1.5 text-zinc-700">/</span>
        <Link href={`/video/${video.id}`} className="text-reels-cyan/90 hover:text-reels-cyan">
          조각 상세
        </Link>
        <span className="mx-1.5 text-zinc-700">/</span>
        <span className="text-zinc-400">AI 창작</span>
      </nav>
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100 sm:text-3xl">
          창작 스튜디오
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-500">
          구매한 모션 권리로 Gemini(Nano Banana 2)·Kling Motion Control 파이프라인에 연결됩니다.
          프로필은 마이페이지에 등록한 이미지 중에서 고르고, 배경은 텍스트로 지정하세요.
        </p>
        <p className="mt-1 font-mono text-[12px] text-zinc-600">
          현재 조각: {video.title} · {video.creator}
        </p>
      </header>
      <KlingReskinStudio video={video} creationFlow />
    </>
  );
}

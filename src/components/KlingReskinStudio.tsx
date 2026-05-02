"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ReskinGenerationQueueModal } from "@/components/ReskinGenerationQueueModal";
import { DEMO_FACE_PROFILES } from "@/data/demoFaceProfiles";
import type { FeedVideo } from "@/data/videos";
import { sanitizePosterSrc } from "@/lib/videoPoster";

type Props = {
  video: FeedVideo;
  /** 창작 탭 전용: 설정(프로필 관리) 선택 등 추가 단계 */
  creationFlow?: boolean;
};

export function KlingReskinStudio({ video, creationFlow = false }: Props) {
  const [profileId, setProfileId] = useState<string | null>(DEMO_FACE_PROFILES[0]?.id ?? null);
  const [faceName, setFaceName] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [strength, setStrength] = useState(62);
  const [generating, setGenerating] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isPexelsBlockedVideo = /^https?:\/\/videos\.pexels\.com\//i.test(video.src);
  const posterSrc = sanitizePosterSrc(video.poster);

  const closeQueue = useCallback(() => {
    setQueueOpen(false);
    setGenerating(false);
  }, []);

  const onGenerate = useCallback(() => {
    setGenerating(true);
    setQueueOpen(true);
  }, []);

  useEffect(() => {
    if (!generating && !queueOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeQueue();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [generating, queueOpen, closeQueue]);

  return (
    <section
      className="reels-border-gradient mt-12 rounded-2xl p-5 sm:p-7"
      aria-labelledby="kling-reskin-heading"
    >
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-reels-cyan">
            Kling 3.0 · Reskin
          </p>
          <h2
            id="kling-reskin-heading"
            className="mt-1 text-xl font-extrabold tracking-tight text-zinc-100 sm:text-2xl"
          >
            AI 리스킨 스튜디오
          </h2>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-zinc-500">
            {creationFlow
              ? "구매 후 이어지는 창작 단계입니다. 프로필과 배경을 지정한 뒤 생성을 눌러 주세요."
              : "모션 가이드를 유지한 채 얼굴·배경만 교체합니다. 서비스 연동 시 이 화면에서 바로 결과를 받게 됩니다."}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="min-w-0">
          <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            원본 모션 가이드
          </p>
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40">
            <div
              className={`relative ${video.orientation === "portrait" ? "mx-auto aspect-[3/4] max-w-sm" : "aspect-video w-full"}`}
            >
              <video
                className="h-full w-full object-cover"
                poster={posterSrc}
                src={isPexelsBlockedVideo ? undefined : video.src}
                muted
                playsInline
                loop
                autoPlay
                preload={isPexelsBlockedVideo ? "none" : "metadata"}
              />
              {generating ? (
                <div className="reels-scan-overlay reels-data-stream z-10 rounded-xl">
                  <div className="reels-scan-line" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="rounded-full border border-reels-cyan/40 bg-black/60 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-reels-cyan">
                      처리 중…
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            소스 & 프롬프트
          </p>

          {creationFlow ? (
            <div className="reels-glass-card rounded-xl p-4">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                ① 설정 — 프로필 관리
              </p>
              <p className="mt-1 text-[12px] text-zinc-400">
                창작에 쓸 얼굴입니다.{" "}
                <a href="/settings?tab=profile" className="text-reels-cyan/90 underline-offset-2 hover:underline">
                  설정 › 프로필 관리
                </a>
                에서 등록하는 이미지와 동일한 데모 세트입니다.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {DEMO_FACE_PROFILES.map((p) => {
                  const on = profileId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setProfileId(p.id);
                        setFaceName(null);
                      }}
                      className={`relative rounded-full p-0.5 ring-2 transition-shadow ${
                        on ? "ring-reels-cyan shadow-[0_0_16px_-4px_rgba(0,242,234,0.5)]" : "ring-transparent hover:ring-white/20"
                      }`}
                      aria-pressed={on}
                      aria-label={p.label}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.src}
                        alt=""
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="reels-glass-card rounded-xl p-4">
            <label className="block text-[12px] font-semibold text-zinc-300">
              {creationFlow ? "② 다른 얼굴 이미지 (선택)" : "레퍼런스 얼굴 이미지"}
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="mt-2 block w-full text-[12px] text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-reels-crimson/20 file:px-3 file:py-2 file:font-semibold file:text-reels-crimson file:backdrop-blur-sm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setFaceName(f?.name ?? null);
                if (f) setProfileId(null);
              }}
            />
            {faceName ? (
              <p className="mt-2 truncate font-mono text-[10px] text-zinc-500">{faceName}</p>
            ) : null}
          </div>
          <div className="reels-glass-card rounded-xl p-4">
            <label
              htmlFor="reskin-bg-prompt"
              className="block text-[12px] font-semibold text-zinc-300"
            >
              {creationFlow ? "③ 배경 프롬프트" : "배경 프롬프트"}
            </label>
            <textarea
              id="reskin-bg-prompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='예: 눈 내리는 파리 에펠탑 앞, 시네마틱 · 네온이 비치는 비 오는 도쿄 골목'
              className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:border-reels-cyan/50 focus:outline-none focus:ring-1 focus:ring-reels-cyan/40"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-stretch gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 sm:max-w-md">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              모션 강도
            </span>
            <span className="font-mono text-sm font-bold tabular-nums text-reels-cyan">
              {strength}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={strength}
            onChange={(e) => setStrength(Number(e.target.value))}
            className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-reels-cyan"
          />
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating}
          className="reels-ai-glow relative shrink-0 rounded-full bg-gradient-to-r from-reels-cyan/25 to-reels-crimson/25 px-8 py-3.5 text-[14px] font-extrabold tracking-tight text-zinc-100 transition-opacity disabled:cursor-wait disabled:opacity-60"
        >
          <span className="relative z-10">Generate Reskin</span>
        </button>
      </div>

      <ReskinGenerationQueueModal open={queueOpen} onClose={closeQueue} demoCloseMs={8000} />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="reels-glass-card rounded-xl p-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-500">
            Original motion
          </p>
          <div className="relative mt-2 aspect-video overflow-hidden rounded-lg bg-black/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={posterSrc}
              alt=""
              className="h-full w-full object-cover opacity-95"
            />
          </div>
        </div>
        <div className="reels-glass-card rounded-xl p-3 ring-1 ring-reels-cyan/25">
          <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-reels-cyan">
            AI preview (demo)
          </p>
          <div className="relative mt-2 flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-reels-crimson/25 via-reels-void to-reels-cyan/20">
            <div className="absolute inset-0 reels-data-stream opacity-60" />
            <span className="relative z-10 rounded border border-reels-cyan/30 bg-black/55 px-3 py-2 text-center text-[11px] font-bold text-zinc-300">
              API 연결 시 결과가 표시됩니다
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

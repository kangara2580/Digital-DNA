"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ReskinGenerationQueueModal } from "@/components/ReskinGenerationQueueModal";
import { DEMO_FACE_PROFILES } from "@/data/demoFaceProfiles";
import type { FeedVideo } from "@/data/videos";
import { useTranslation } from "@/hooks/useTranslation";
import { sanitizePosterSrc } from "@/lib/videoPoster";

type Props = {
  video: FeedVideo;
  /** 창작 탭 전용: 설정(AI 프로필 설정) 선택 등 추가 단계 */
  creationFlow?: boolean;
};

export function KlingReskinStudio({ video, creationFlow = false }: Props) {
  const { t } = useTranslation();
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
            {t("kling.studio.title")}
          </h2>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-zinc-500">
            {creationFlow ? t("kling.studio.leadPurchase") : t("kling.studio.leadDemo")}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="min-w-0">
          <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            {t("kling.studio.motionGuide")}
          </p>
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40">
            <div
              className={`relative ${video.orientation === "portrait" ? "mx-auto aspect-[9/16] max-w-sm" : "aspect-video w-full"}`}
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
                      {t("kling.studio.processing")}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            {t("kling.studio.sourcePrompt")}
          </p>

          {creationFlow ? (
            <div className="reels-glass-card rounded-xl p-4">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {t("kling.studio.step1Profile")}
              </p>
              <p className="mt-1 text-[12px] text-zinc-400">{t("kling.studio.step1Lead")}</p>
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
              {creationFlow ? t("kling.studio.step2AltFace") : t("kling.studio.refFace")}
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
              {t("kling.studio.bgPrompt")}
            </label>
            <textarea
              id="reskin-bg-prompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t("kling.studio.bgPromptPh")}
              className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:border-reels-cyan/50 focus:outline-none focus:ring-1 focus:ring-reels-cyan/40"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-stretch gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 sm:max-w-md">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              {t("kling.studio.motionStrength")}
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
              {t("kling.studio.apiPlaceholder")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

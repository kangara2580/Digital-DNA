"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FeedVideo } from "@/data/videos";
import { SAMPLE_VIDEOS, shuffleVideos } from "@/data/videos";
import { isMicroDna } from "@/data/videoCommerce";
import { SectionMoreLink } from "./SectionMoreLink";
import { VideoCard } from "./VideoCard";

function isRecommendFeedClip(v: FeedVideo): boolean {
  if (v.id.startsWith("dna-")) return false;
  if (isMicroDna(v)) return false;
  return true;
}

/** `is_ai_generated`와 동일 — true만 AI, 그 외는 직접 촬영(Real) */
function isAiVideo(v: FeedVideo): boolean {
  return v.isAiGenerated === true;
}

type ContentFilter = "all" | "real" | "ai";

function matchesContentFilter(v: FeedVideo, filter: ContentFilter): boolean {
  if (filter === "all") return true;
  if (filter === "ai") return isAiVideo(v);
  return !isAiVideo(v);
}

const FILTER_OPTIONS: { id: ContentFilter; label: string; sub: string }[] = [
  { id: "all", label: "전체", sub: "" },
  { id: "real", label: "직접 촬영", sub: "Real" },
  { id: "ai", label: "AI 제작", sub: "AI" },
];

/**
 * lg 이상 6열 → 세로 클립 12개면 정확히 2행(이전 6개면 1행만 채워짐).
 * 모바일~md는 열 수에 따라 자연스럽게 여러 행.
 */
const REELS_GRID =
  "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6 lg:gap-4";

export function VideoFeed() {
  const portraitBase = useMemo(
    () =>
      SAMPLE_VIDEOS.filter(
        (v) => v.orientation === "portrait" && isRecommendFeedClip(v),
      ),
    [],
  );

  const [clips, setClips] = useState(portraitBase);
  const [contentFilter, setContentFilter] = useState<ContentFilter>("all");

  useEffect(() => {
    setClips(shuffleVideos([...portraitBase]));
  }, [portraitBase]);

  const filteredClips = useMemo(
    () => clips.filter((v) => matchesContentFilter(v, contentFilter)),
    [clips, contentFilter],
  );

  return (
    <section
      className="relative w-full overflow-hidden border-t border-white/10"
      aria-labelledby="recommended-feed-heading"
    >
      {/* 배경 글로우 — 추천 섹션만 살짝 떠 있는 느낌 */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(0,242,234,0.14),transparent_55%),radial-gradient(ellipse_70%_50%_at_100%_50%,rgba(255,0,85,0.08),transparent_50%),radial-gradient(ellipse_60%_40%_at_0%_80%,rgba(99,102,241,0.1),transparent_45%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-[1800px] px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
        <div className="rounded-[28px] border border-white/[0.12] bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_80px_-24px_rgba(0,0,0,0.55),0_0_60px_-20px_rgba(0,242,234,0.12)] backdrop-blur-md sm:p-7 md:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
            <div className="min-w-0 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00f2ea]/35 bg-[#00f2ea]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#9ffbf6] sm:text-[12px]">
                  <Sparkles
                    className="h-3.5 w-3.5 text-[#00f2ea] sm:h-4 sm:w-4"
                    aria-hidden
                  />
                  오늘의 픽
                </span>
                <span className="hidden text-[12px] text-zinc-500 sm:inline">
                  취향에 맞춘 큐레이션
                </span>
              </div>
              <h2
                id="recommended-feed-heading"
                className="mt-3 bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-[24px] font-extrabold leading-tight tracking-tight text-transparent sm:text-[28px] md:text-[32px]"
              >
                추천 영상
              </h2>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-400 sm:text-[16px]">
                지금 눈에 들어오는 릴스만 모았어요. 스크롤 멈추고 하나씩
                골라보기 좋은 라인업입니다.
              </p>
            </div>
            <SectionMoreLink
              category="recommend"
              className="shrink-0 self-start sm:self-center"
            />
          </div>

          <div
            className="mt-6 flex flex-col gap-2 sm:mt-7"
            role="group"
            aria-label="콘텐츠 유형 필터"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              콘텐츠 유형
            </p>
            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.map(({ id, label, sub }) => {
                const selected = contentFilter === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setContentFilter(id)}
                    className={`inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-3.5 py-2 text-left text-[13px] font-semibold transition-colors sm:min-h-0 sm:px-4 sm:py-2.5 sm:text-[14px] ${
                      selected
                        ? "border-reels-cyan/45 bg-reels-cyan/15 text-zinc-100 shadow-[0_0_20px_-8px_rgba(0,242,234,0.35)]"
                        : "border-white/10 bg-black/20 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                    }`}
                    aria-pressed={selected}
                  >
                    <span>{label}</span>
                    {sub ? (
                      <span
                        className={`font-mono text-[10px] font-bold uppercase tracking-wider sm:text-[11px] ${
                          selected ? "text-reels-cyan/95" : "text-zinc-600"
                        }`}
                      >
                        {sub}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`mt-8 sm:mt-9 ${REELS_GRID}`}>
            {filteredClips.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-white/15 bg-black/20 px-4 py-14 text-center text-[14px] text-zinc-500">
                이 조건에 맞는 영상이 없습니다. 다른 필터를 선택해 보세요.
              </div>
            ) : (
              filteredClips.map((video) => (
                <div
                  key={`feed-p-${video.id}`}
                  className="group/card relative min-w-0 rounded-2xl p-[1px] transition-[filter,transform] duration-300 hover:shadow-[0_12px_40px_-12px_rgba(0,242,234,0.25)]"
                >
                  <div
                    className="absolute -inset-px rounded-2xl bg-gradient-to-br from-[#00f2ea]/25 via-transparent to-[#ff0055]/20 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
                    aria-hidden
                  />
                  <div className="relative rounded-[15px] bg-[#05070d]/80 p-1">
                    <VideoCard
                      video={video}
                      domId={`clip-${video.id}`}
                      className="min-w-0"
                      reelLayout
                      topBadge="추천"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

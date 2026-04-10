"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EditorCurationClipThumb } from "@/components/EditorCurationClipThumb";
import { SectionMoreLink } from "@/components/SectionMoreLink";
import { CATEGORY_LABEL } from "@/data/videoCatalog";
import {
  EDITOR_CURATIONS,
  EDITOR_CURATION_CLIP_LIMIT,
  getEditorCurationClips,
  type EditorCuration,
} from "@/data/marketing";

/** 한 페이지에 보이는 썸 개수(큰 화면 기준 6칸) */
const PAGE_SIZE = 6;

function EditorCurationBlock({
  block,
  featured,
}: {
  block: EditorCuration;
  featured: boolean;
}) {
  const clips = useMemo(
    () => getEditorCurationClips(block.categorySlug),
    [block.categorySlug],
  );
  const videoPageCount =
    clips.length === 0 ? 0 : Math.ceil(clips.length / PAGE_SIZE);
  const totalPages = videoPageCount + 1;
  const [page, setPage] = useState(0);

  const isMorePage = page >= videoPageCount;
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  const slice =
    !isMorePage && clips.length > 0
      ? clips.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
      : [];

  const go = (dir: -1 | 1) => {
    setPage((p) => {
      const n = p + dir;
      if (n < 0 || n >= totalPages) return p;
      return n;
    });
  };

  const catName = CATEGORY_LABEL[block.categorySlug];

  return (
    <div
      className={`min-w-0 rounded-2xl p-4 sm:p-5 ${
        featured
          ? "reels-border-gradient bg-reels-void/50 shadow-[0_0_40px_-12px_rgba(255,0,85,0.2)]"
          : "border border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 text-left">
          {featured ? (
            <span className="mb-1 inline-block rounded-full border border-reels-crimson/40 bg-reels-crimson/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-reels-crimson">
              Featured
            </span>
          ) : null}
          <h3 className="text-[17px] font-extrabold leading-snug tracking-tight text-zinc-100 sm:text-[18px]">
            <span className="mr-1.5 inline-block" aria-hidden>
              {block.emoji}
            </span>
            {block.title}
          </h3>
        </div>
        <SectionMoreLink
          category={block.categorySlug}
          className="w-full shrink-0 sm:w-auto sm:self-center"
        />
      </div>

      <div className="mt-3 flex min-w-0 gap-2 sm:mt-4 sm:gap-3">
        <div className="min-w-0 flex-1">
          {isMorePage ? (
            <Link
              href={`/category/${block.categorySlug}`}
              className="group flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-reels-cyan/45 bg-gradient-to-br from-reels-crimson/[0.14] via-reels-void/85 to-reels-cyan/[0.1] px-5 py-10 text-center transition hover:border-reels-cyan/70 hover:from-reels-crimson/[0.2] sm:min-h-[260px] sm:gap-4 sm:py-12"
              aria-label={`${catName} 카테고리에서 더 많은 영상 보기`}
            >
              <span className="text-[24px] font-black tracking-tight text-zinc-100 sm:text-[28px] md:text-[32px]">
                더보기
              </span>
              <span className="max-w-md text-[14px] font-medium leading-relaxed text-zinc-400 sm:text-[15px]">
                {catName} 영상 · 약 {EDITOR_CURATION_CLIP_LIMIT}개까지 미리 보기
                <br className="hidden sm:block" />
                <span className="sm:ml-1">그다음은 카테고리에서 전부 볼 수 있어요.</span>
              </span>
              <span className="mt-1 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/55 px-6 py-3 text-[14px] font-extrabold text-reels-cyan shadow-lg backdrop-blur-sm transition group-hover:border-reels-cyan/45 group-hover:bg-black/65 sm:px-8 sm:py-3.5 sm:text-[15px]">
                {catName} 전체 보기
                <ChevronRight className="h-5 w-5 shrink-0" strokeWidth={2.25} />
              </span>
            </Link>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {slice.map((v) => (
                <EditorCurationClipThumb
                  key={`${block.id}-${v.id}`}
                  video={v}
                  className="min-w-0 w-full"
                />
              ))}
            </div>
          )}
        </div>

        <div
          className="flex shrink-0 flex-col justify-center gap-2 self-stretch rounded-xl border border-white/18 bg-[rgba(8,8,10,0.94)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-md [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/95"
          role="group"
          aria-label="클립 페이지 넘기기"
        >
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={!canPrev}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-zinc-950/90 text-zinc-100 transition hover:border-reels-cyan/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
            aria-label="이전 페이지"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={!canNext}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-zinc-950/90 text-zinc-100 transition hover:border-reels-cyan/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
            aria-label="다음 페이지"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>
      </div>

      <p className="mt-2 text-center text-[11px] font-medium tabular-nums text-zinc-500 sm:text-left sm:text-[12px]">
        {isMorePage
          ? "더보기"
          : `${page + 1} / ${totalPages}`}
      </p>
    </div>
  );
}

export function EditorCurationSection() {
  return (
    <section
      className="border-t border-white/10 bg-transparent"
      aria-labelledby="editor-curation-heading"
    >
      <div className="mx-auto max-w-[1800px] px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
        <div className="text-left">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-reels-cyan">
            Situation Curation
          </p>
          <h2
            id="editor-curation-heading"
            className="mt-1 text-[22px] font-extrabold leading-snug tracking-tight text-zinc-100 sm:text-[26px] md:text-[28px]"
          >
            이런 상황에 딱!
          </h2>
        </div>

        <div className="mt-6 flex flex-col gap-10 sm:mt-8 sm:gap-12">
          {EDITOR_CURATIONS.map((block, i) => (
            <EditorCurationBlock key={block.id} block={block} featured={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}

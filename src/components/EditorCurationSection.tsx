"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef } from "react";
import { EditorCurationClipThumb } from "@/components/EditorCurationClipThumb";
import { SectionMoreLink } from "@/components/SectionMoreLink";
import { CATEGORY_LABEL } from "@/data/videoCatalog";
import {
  EDITOR_CURATION_CLIP_LIMIT,
  EDITOR_CURATIONS,
  getEditorCurationClips,
  type EditorCuration,
} from "@/data/marketing";
import { usePassVerticalWheelToPage } from "@/hooks/usePassVerticalWheelToPage";

/** 썸네일과 동일 너비 — EditorCurationClipThumb 기본과 맞춤 */
const THUMB_SLOT =
  "w-[104px] min-w-[104px] max-w-[104px] shrink-0 sm:w-[118px] sm:min-w-[118px] sm:max-w-[118px]";

const STRIP =
  "no-scrollbar -mx-1 flex w-full snap-x snap-proximity items-stretch gap-3 overflow-x-auto px-1 pb-1 sm:-mx-0 sm:gap-3.5 sm:px-0";

function EditorCurationBlock({
  block,
}: {
  block: EditorCuration;
}) {
  const clips = useMemo(
    () => getEditorCurationClips(block.categorySlug),
    [block.categorySlug],
  );

  const catName = CATEGORY_LABEL[block.categorySlug];
  const scrollRef = useRef<HTMLDivElement>(null);
  usePassVerticalWheelToPage(scrollRef);

  return (
    <div
      className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.07] p-4 shadow-[0_14px_40px_-24px_rgba(0,0,0,0.45)] [html[data-theme='light']_&]:border-black/10 [html[data-theme='light']_&]:bg-[rgba(248,250,252,0.96)] sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 text-left">
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

      <div className="relative mt-3 sm:mt-4">
        <div
          ref={scrollRef}
          className={STRIP}
          role="list"
          aria-label={`${block.title} 큐레이션 클립`}
        >
          {clips.map((v) => (
            <div key={`${block.id}-${v.id}`} className={`snap-start ${THUMB_SLOT}`} role="listitem">
              <EditorCurationClipThumb video={v} className="w-full min-w-0" />
            </div>
          ))}

          <Link
            href={`/category/${block.categorySlug}`}
            className={`group/more snap-end ${THUMB_SLOT} flex flex-col`}
            role="listitem"
            aria-label={`${catName} 카테고리 전체 보기`}
          >
            <div className="relative flex aspect-[3/4] flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border border-dashed border-reels-cyan/40 bg-gradient-to-br from-reels-crimson/[0.12] via-reels-void/80 to-reels-cyan/[0.08] px-2 text-center transition-[border-color,background-color,box-shadow] hover:border-reels-cyan/65 hover:from-reels-crimson/[0.18] hover:shadow-[0_8px_28px_-12px_rgba(0,242,234,0.2)] [html[data-theme='light']_&]:from-white [html[data-theme='light']_&]:to-zinc-50 [html[data-theme='light']_&]:hover:border-reels-cyan/55">
              <span className="text-[11px] font-extrabold leading-tight text-zinc-100 sm:text-[12px]">
                더보기
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-reels-cyan transition-transform duration-200 group-hover/more:translate-x-0.5 sm:h-[18px] sm:w-[18px]"
                strokeWidth={2.25}
                aria-hidden
              />
              <span className="px-0.5 text-[9px] font-medium leading-tight text-zinc-500 sm:text-[10px]">
                {catName} · 최대 {EDITOR_CURATION_CLIP_LIMIT}개 미리보기
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-center text-[11px] font-semibold leading-snug text-reels-cyan/90 sm:text-[12px]">
              전체 보기
            </p>
          </Link>
        </div>
      </div>
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
          <h2
            id="editor-curation-heading"
            className="text-[22px] font-extrabold leading-snug tracking-tight text-zinc-100 sm:text-[26px] md:text-[28px]"
          >
            이런 상황에 딱!
          </h2>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:mt-8 sm:grid-cols-2 sm:gap-7">
          {EDITOR_CURATIONS.map((block) => (
            <EditorCurationBlock key={block.id} block={block} />
          ))}
        </div>
      </div>
    </section>
  );
}

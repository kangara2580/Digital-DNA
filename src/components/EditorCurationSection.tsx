"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

/** 인기순위 스트립과 비슷하게 — 너무 검지 않게 글래스 톤 */
const ARROW_BTN =
  "pointer-events-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/22 bg-white/[0.12] text-zinc-100 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.45)] backdrop-blur-md transition hover:border-reels-cyan/40 hover:bg-white/[0.2] hover:text-white active:scale-[0.97] motion-reduce:transition-none [html[data-theme='light']_&]:border-zinc-300/80 [html[data-theme='light']_&]:bg-white/90 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:shadow-zinc-400/20";

const FADE_LEFT =
  "pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-zinc-950/55 via-zinc-950/25 to-transparent sm:w-14 [html[data-theme='light']_&]:from-white/70 [html[data-theme='light']_&]:via-white/35";

const FADE_RIGHT =
  "pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-zinc-950/55 via-zinc-950/25 to-transparent sm:w-14 [html[data-theme='light']_&]:from-white/70 [html[data-theme='light']_&]:via-white/35";

/** 썸네일 박스 높이(제목 제외) — 화살표 세로 정렬 기준 */
const THUMB_BOX_H =
  "h-[calc(104px*4/3)] sm:h-[calc(118px*4/3)]";

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

  const catName = CATEGORY_LABEL[block.categorySlug];
  const scrollRef = useRef<HTMLDivElement>(null);
  usePassVerticalWheelToPage(scrollRef);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, clientWidth, scrollWidth } = el;
    const max = scrollWidth - clientWidth;
    setCanLeft(scrollLeft > 6);
    setCanRight(max > 6 && scrollLeft < max - 6);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => updateScrollState());
    ro.observe(el);
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    updateScrollState();
    requestAnimationFrame(() => updateScrollState());

    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, clips.length]);

  const scrollByDir = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return;
    const step = Math.min(Math.max(el.clientWidth * 0.38, 200), max / 3.2);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <div
      className={`min-w-0 rounded-2xl p-4 sm:p-5 ${
        featured
          ? "border border-reels-crimson/45 bg-reels-void/50 shadow-[0_0_40px_-12px_rgba(255,0,85,0.2)]"
          : "border border-reels-crimson/35 bg-white/[0.03] shadow-[0_0_28px_-16px_rgba(255,0,85,0.18)]"
      }`}
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
        {canLeft ? <div className={FADE_LEFT} aria-hidden /> : null}
        {canRight ? <div className={FADE_RIGHT} aria-hidden /> : null}

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

        {canLeft ? (
          <button
            type="button"
            className={`${ARROW_BTN} absolute left-0 top-0 z-20 flex ${THUMB_BOX_H} w-10 items-center justify-center sm:w-11`}
            aria-label="이전 클립"
            onClick={() => scrollByDir(-1)}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        ) : null}
        {canRight ? (
          <button
            type="button"
            className={`${ARROW_BTN} absolute right-0 top-0 z-20 flex ${THUMB_BOX_H} w-10 items-center justify-center sm:w-11`}
            aria-label="다음 클립"
            onClick={() => scrollByDir(1)}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        ) : null}
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

        <div className="mt-6 grid grid-cols-1 gap-6 sm:mt-8 sm:grid-cols-2 sm:gap-7">
          {EDITOR_CURATIONS.map((block, i) => (
            <EditorCurationBlock key={block.id} block={block} featured={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}

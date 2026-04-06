"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useDopamineBasket } from "@/context/DopamineBasketContext";

/**
 * 장바구니에 조각이 있을 때만 하단에 항상 peek 바.
 * 펼치면 타임라인, 접으면 얇은 막대만 — 비행 파티클 없이 방해 최소화.
 */
export function DnaBuilderDock() {
  const { builderItems, removeBuilderItem, clearBuilder } = useDopamineBasket();
  const hasItems = builderItems.length > 0;
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!hasItems) setExpanded(false);
  }, [hasItems]);

  const spacerClass = hasItems
    ? expanded
      ? "h-[min(300px,42vh)] sm:h-[280px]"
      : "h-14 sm:h-[3.5rem] pb-[max(0px,env(safe-area-inset-bottom))]"
    : "h-0";

  return (
    <>
      <div className={`shrink-0 transition-[height] duration-300 ease-out ${spacerClass}`} aria-hidden />

      <AnimatePresence>
        {hasItems ? (
          <motion.div
            initial={{ y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 32, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-[55] flex flex-col"
            style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
            role="region"
            aria-label="DNA 조합기"
          >
            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.div
                  key="expanded"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden border-t border-white/12 bg-reels-void/95 shadow-[0_-8px_32px_-12px_rgba(0,242,234,0.1)] backdrop-blur-xl [border-top-width:0.5px]"
                >
                  <div className="mx-auto max-w-[1800px] px-3 pb-2 pt-2 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-reels-cyan">
                          DNA 조합기
                        </p>
                        <p className="text-[13px] font-semibold text-zinc-100">
                          담은 조각을 이어 붙여 보기
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setExpanded(false)}
                          className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-zinc-200 transition-colors hover:bg-white/10"
                          aria-expanded="true"
                          aria-controls="dna-builder-timeline"
                        >
                          <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
                          접기
                        </button>
                        <button
                          type="button"
                          onClick={clearBuilder}
                          className="rounded-full px-2.5 py-1.5 text-[12px] font-medium text-zinc-500 hover:bg-white/10 hover:text-zinc-200"
                        >
                          비우기
                        </button>
                        <Link
                          href="/cart"
                          className="rounded-full bg-reels-crimson px-3.5 py-2 text-[12px] font-extrabold text-white shadow-reels-crimson hover:brightness-110 sm:px-4 sm:text-[13px]"
                        >
                          결제로 가기
                        </Link>
                      </div>
                    </div>
                    <div
                      id="dna-builder-timeline"
                      className="no-scrollbar flex max-h-[min(38vh,220px)] min-h-[72px] items-center gap-0 overflow-x-auto px-1 pb-2 pt-3"
                    >
                      {builderItems.map((item, i) => (
                        <div key={item.key} className="flex shrink-0 items-center">
                          {i > 0 ? (
                            <span
                              className="mx-1 select-none text-[14px] font-light text-reels-cyan/40 sm:mx-1.5"
                              aria-hidden
                            >
                              +
                            </span>
                          ) : null}
                          <div className="relative flex w-[52px] flex-col items-center gap-0.5 sm:w-[58px]">
                            <div className="relative w-full">
                              <div className="aspect-[3/4] w-full overflow-hidden rounded-md border border-white/12 bg-black/40 shadow-sm ring-1 ring-reels-cyan/15">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={item.video.poster}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeBuilderItem(item.key)}
                                className="absolute -right-1 -top-1 z-[1] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-reels-void text-zinc-300 shadow ring-1 ring-white/20 hover:bg-white/10"
                                aria-label="타임라인에서 제거"
                              >
                                <X className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                              </button>
                            </div>
                            <span className="max-w-[4.5rem] truncate text-center text-[9px] font-semibold tabular-nums text-reels-cyan sm:text-[10px]">
                              {item.video.priceWon != null
                                ? `${item.video.priceWon.toLocaleString("ko-KR")}원`
                                : "—"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Peek: 항상 노출 (조각이 있을 때만 전체가 렌더됨) */}
            <div className="border-t border-white/12 bg-reels-void/92 shadow-[0_-4px_24px_-8px_rgba(255,0,85,0.12)] backdrop-blur-xl [border-top-width:0.5px]">
              <div className="mx-auto flex max-w-[1800px] items-center gap-2 px-3 py-2 sm:gap-3 sm:px-6 lg:px-8">
                <button
                  type="button"
                  onClick={() => setExpanded((e) => !e)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1.5 text-[12px] font-medium text-zinc-200 transition-colors hover:bg-white/12"
                  aria-expanded={expanded}
                  aria-controls="dna-builder-timeline"
                >
                  {expanded ? (
                    <ChevronDown className="h-4 w-4 text-reels-cyan" strokeWidth={2.2} aria-hidden />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-reels-cyan" strokeWidth={2.2} aria-hidden />
                  )}
                  <span className="hidden sm:inline">타임라인</span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-bold text-zinc-100 sm:text-[13px]">
                    DNA 조합기
                    <span className="ml-1.5 font-mono text-[11px] font-medium text-reels-cyan sm:text-[12px]">
                      {builderItems.length}개
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <div className="hidden h-8 max-w-[120px] items-center gap-0.5 overflow-hidden sm:flex">
                    {builderItems.slice(0, 4).map((item) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={item.key}
                        src={item.video.poster}
                        alt=""
                        className="h-8 w-6 rounded-sm border border-white/15 object-cover"
                      />
                    ))}
                  </div>
                  <Link
                    href="/cart"
                    className="rounded-full bg-reels-crimson px-3 py-1.5 text-[11px] font-extrabold text-white shadow-reels-crimson hover:brightness-110 sm:px-3.5 sm:text-[12px]"
                  >
                    결제
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

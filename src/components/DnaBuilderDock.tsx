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
                  className="overflow-hidden border-t border-[#e2e8f0] bg-white/98 shadow-[0_-8px_32px_-12px_rgba(15,23,42,0.14)] backdrop-blur-md [border-top-width:0.5px]"
                >
                  <div className="mx-auto max-w-[1800px] px-3 pb-2 pt-2 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100/90 pb-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          DNA 조합기
                        </p>
                        <p className="text-[13px] font-medium text-slate-900">
                          담은 조각을 이어 붙여 보기
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setExpanded(false)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200/95 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                          aria-expanded="true"
                          aria-controls="dna-builder-timeline"
                        >
                          <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
                          접기
                        </button>
                        <button
                          type="button"
                          onClick={clearBuilder}
                          className="rounded-full px-2.5 py-1.5 text-[12px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        >
                          비우기
                        </button>
                        <Link
                          href="/cart"
                          className="rounded-full bg-slate-900 px-3.5 py-2 text-[12px] font-semibold text-white hover:opacity-90 sm:px-4 sm:text-[13px]"
                        >
                          결제로 가기
                        </Link>
                      </div>
                    </div>
                    <div
                      id="dna-builder-timeline"
                      className="no-scrollbar flex max-h-[min(38vh,220px)] min-h-[64px] items-center gap-0 overflow-x-auto py-2"
                    >
                      {builderItems.map((item, i) => (
                        <div key={item.key} className="flex shrink-0 items-center">
                          {i > 0 ? (
                            <span
                              className="mx-1 select-none text-[14px] font-light text-slate-400 sm:mx-1.5"
                              aria-hidden
                            >
                              +
                            </span>
                          ) : null}
                          <div className="relative flex w-[52px] flex-col items-center gap-0.5 sm:w-[58px]">
                            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md border border-slate-200/95 bg-slate-100 shadow-sm ring-1 ring-slate-900/5">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.video.poster}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeBuilderItem(item.key)}
                                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-600 shadow ring-1 ring-slate-200/90 hover:bg-slate-50"
                                aria-label="타임라인에서 제거"
                              >
                                <X className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                              </button>
                            </div>
                            <span className="max-w-[4.5rem] truncate text-center text-[9px] font-semibold tabular-nums text-slate-700 sm:text-[10px]">
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
            <div className="border-t border-[#e2e8f0] bg-white/95 shadow-[0_-4px_24px_-8px_rgba(15,23,42,0.12)] backdrop-blur-sm [border-top-width:0.5px]">
              <div className="mx-auto flex max-w-[1800px] items-center gap-2 px-3 py-2 sm:gap-3 sm:px-6 lg:px-8">
                <button
                  type="button"
                  onClick={() => setExpanded((e) => !e)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50/90 px-2.5 py-1.5 text-[12px] font-medium text-slate-800 transition-colors hover:bg-slate-100"
                  aria-expanded={expanded}
                  aria-controls="dna-builder-timeline"
                >
                  {expanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-600" strokeWidth={2.2} aria-hidden />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-slate-600" strokeWidth={2.2} aria-hidden />
                  )}
                  <span className="hidden sm:inline">타임라인</span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-slate-900 sm:text-[13px]">
                    DNA 조합기
                    <span className="ml-1.5 font-mono text-[11px] font-medium text-slate-500 sm:text-[12px]">
                      {builderItems.length}개
                    </span>
                  </p>
                  {!expanded ? (
                    <p className="truncate text-[10px] text-slate-500 sm:text-[11px]">
                      위 화살표로 펼쳐서 이어 붙여 보기 · 영상 시청을 가리지 않아요
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <div className="hidden h-8 max-w-[120px] items-center gap-0.5 overflow-hidden sm:flex">
                    {builderItems.slice(0, 4).map((item) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={item.key}
                        src={item.video.poster}
                        alt=""
                        className="h-8 w-6 rounded-sm border border-slate-200/90 object-cover"
                      />
                    ))}
                  </div>
                  <Link
                    href="/cart"
                    className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:opacity-90 sm:px-3.5 sm:text-[12px]"
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

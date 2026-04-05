"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { X } from "lucide-react";
import { useDopamineBasket } from "@/context/DopamineBasketContext";

/** 장바구니에 담긴 조각을 이어 붙이는 하단 DNA 조합기 + 본문 하단 여백 */
export function DnaBuilderDock() {
  const { builderItems, removeBuilderItem, clearBuilder } = useDopamineBasket();
  const open = builderItems.length > 0;

  return (
    <>
      <div
        className={open ? "h-[min(112px,28vh)] shrink-0 sm:h-[104px]" : "h-0"}
        aria-hidden
      />
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-[55] border-t border-[#e2e8f0] bg-white/98 shadow-[0_-12px_40px_-16px_rgba(15,23,42,0.18)] backdrop-blur-md [border-top-width:0.5px] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
            role="region"
            aria-label="DNA 조합기 임시 타임라인"
          >
            <div className="mx-auto flex max-w-[1800px] flex-col gap-2 px-3 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    DNA 조합기
                  </p>
                  <p className="text-[13px] font-medium text-slate-900">
                    담은 조각을 이어 붙여 내 영상과 어울리는지 미리 느껴보세요
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearBuilder}
                    className="rounded-full px-3 py-1.5 text-[12px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                  >
                    비우기
                  </button>
                  <Link
                    href="/cart"
                    className="rounded-full bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    결제로 가기
                  </Link>
                </div>
              </div>
              <div className="no-scrollbar flex min-h-[64px] items-center gap-0 overflow-x-auto pb-1">
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
    </>
  );
}

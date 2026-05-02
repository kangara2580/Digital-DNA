"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDopamineBasket } from "@/context/DopamineBasketContext";
import { usePurchasedVideos } from "@/context/PurchasedVideosContext";
import { useAuthSession } from "@/hooks/useAuthSession";
import type { FeedVideo } from "@/data/videos";
import { sellerProfileHrefFromVideo } from "@/lib/sellerProfile";
import { sanitizePosterSrc } from "@/lib/videoPoster";

const cartOutlineBtn =
  "inline-flex shrink-0 items-center justify-center rounded-xl border border-white/30 bg-transparent px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40 [html[data-theme='light']_&]:border-zinc-900/35 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-100";

function localCartPosterFallback(videoId: string): string {
  const hash = Array.from(videoId).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const idx = (Math.abs(hash) % 10) + 1;
  return `/videos/sample${idx}.jpg`;
}

/** 저장 JSON에 poster가 비거나 sanitize로 빠져도 카드처럼 썸네일이 나오도록 */
function cartThumbnailSrc(video: FeedVideo): string {
  let u = sanitizePosterSrc(video.poster);
  if (u) return u;
  u = sanitizePosterSrc(video.previewSrc);
  if (u) return u;
  const s = typeof video.src === "string" ? video.src.trim() : "";
  if (s && /\.(webp|jpg|jpeg|png|gif|avif)(\?|$)/i.test(s)) {
    const t = sanitizePosterSrc(s);
    return t ?? s;
  }
  return localCartPosterFallback(video.id);
}

export default function CartPage() {
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const {
    builderItems,
    cartSyncReady,
    removeBuilderItem,
    removeBuilderItemsByKeys,
    clearBuilder,
  } = useDopamineBasket();
  /** 로그인·서버 장바구니 로드 전에는 builderItems가 잠깐 []라 빈 화면이 깜빡이지 않게 함 */
  const cartUiReady = !authLoading && cartSyncReady;
  const showLoginGate = supabaseConfigured && !authLoading && !user;
  const { hasPurchased } = usePurchasedVideos();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const valid = new Set(builderItems.map((b) => b.key));
    setSelected((prev) => {
      let changed = false;
      const next = new Set<string>();
      for (const k of prev) {
        if (valid.has(k)) next.add(k);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [builderItems]);

  const toggleKey = useCallback((key: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  }, []);

  const selectedTotal = useMemo(() => {
    let sum = 0;
    for (const { key, video } of builderItems) {
      if (selected.has(key)) sum += video.priceWon ?? 0;
    }
    return sum;
  }, [builderItems, selected]);

  const allKeys = useMemo(() => builderItems.map((b) => b.key), [builderItems]);

  const allItemsSelected =
    allKeys.length > 0 && allKeys.every((k) => selected.has(k));

  const selectAll = useCallback(() => {
    setSelected((prev) => {
      if (allKeys.length === 0) return prev;
      const allSelected =
        allKeys.every((k) => prev.has(k));
      if (allSelected) return new Set();
      return new Set(allKeys);
    });
  }, [allKeys]);

  const deleteSelected = useCallback(() => {
    if (selected.size === 0) return;
    removeBuilderItemsByKeys([...selected]);
    setSelected(new Set());
  }, [selected, removeBuilderItemsByKeys]);

  const confirmClearCart = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!window.confirm("다 삭제하시겠습니까?")) return;
    clearBuilder();
    setSelected(new Set());
  }, [clearBuilder]);

  return (
    <main className="mx-auto min-h-[50vh] max-w-[1800px] px-4 pb-10 pt-[max(5rem,calc(env(safe-area-inset-top,0px)+4.25rem))] text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:px-6 sm:pb-12 sm:pt-[5.75rem] lg:px-8">
      <header className="border-b border-white/10 pb-6 [html[data-theme='light']_&]:border-zinc-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            장바구니
          </h1>
          {cartUiReady && builderItems.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={selectAll} className={cartOutlineBtn}>
                {allItemsSelected ? "선택 해제" : "전체 선택"}
              </button>
              <button
                type="button"
                onClick={deleteSelected}
                disabled={selected.size === 0}
                className={cartOutlineBtn}
              >
                삭제
              </button>
              <button type="button" onClick={confirmClearCart} className={cartOutlineBtn}>
                비우기
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {showLoginGate ? (
        <div className="mx-auto mt-14 max-w-md text-center sm:max-w-lg">
          <p className="text-[14px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            로그인하면 장바구니를 사용할 수 있어요.
          </p>
          <Link
            href={`/login?redirect=${encodeURIComponent("/cart")}`}
            className="mt-6 inline-flex rounded-full bg-reels-crimson px-5 py-2.5 text-[14px] font-extrabold text-white shadow-reels-crimson hover:brightness-110"
          >
            로그인
          </Link>
        </div>
      ) : !cartUiReady ? (
        <div className="mx-auto mt-14 w-full max-w-[1800px] space-y-4" aria-busy="true" aria-live="polite">
          <div className="mx-auto h-4 w-40 animate-pulse rounded bg-white/10 [html[data-theme='light']_&]:bg-zinc-200" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex min-w-0 flex-col rounded-xl border border-white/10 p-4 [html[data-theme='light']_&]:border-zinc-200"
              >
                <div className="aspect-[9/16] w-full animate-pulse rounded-lg bg-white/10 [html[data-theme='light']_&]:bg-zinc-200" />
                <div className="mt-3 space-y-2">
                  <div className="h-4 w-[88%] animate-pulse rounded bg-white/10 [html[data-theme='light']_&]:bg-zinc-200" />
                  <div className="h-3 w-28 animate-pulse rounded bg-white/10 [html[data-theme='light']_&]:bg-zinc-200" />
                  <div className="mt-4 h-3 w-24 animate-pulse rounded bg-white/10 [html[data-theme='light']_&]:bg-zinc-200" />
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            장바구니를 불러오는 중…
          </p>
        </div>
      ) : builderItems.length === 0 ? (
        <div className="mx-auto mt-14 max-w-md text-center sm:max-w-lg">
          <p className="text-[15px] font-semibold text-zinc-200 [html[data-theme='light']_&]:text-zinc-900">
            담긴 영상이 없어요
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full border-2 border-white bg-white px-5 py-2.5 text-[14px] font-extrabold text-zinc-900 transition-colors duration-200 hover:border-[#ff0055] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:border-[#ff0055]"
          >
            둘러보기
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-8">
            {builderItems.map(({ key, video }) => {
              const owned = hasPurchased(video.id);
              const checked = selected.has(key);
              return (
                <li
                  key={key}
                  className="flex min-w-0 flex-col rounded-xl border border-white/10 bg-white/[0.02] p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/80"
                >
                  <div className="relative w-full shrink-0">
                    <label className="absolute left-3 top-3 z-[2] cursor-pointer rounded-md bg-black/50 p-1.5 backdrop-blur-sm [html[data-theme='light']_&]:bg-white/80">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleKey(key)}
                        className="h-5 w-5 rounded border border-white/35 bg-black/50 accent-[#ff0055] [html[data-theme='light']_&]:border-zinc-400 [html[data-theme='light']_&]:bg-white"
                      />
                      <span className="sr-only">선택</span>
                    </label>
                    <Link
                      href={`/video/${video.id}`}
                      className="relative block aspect-[9/16] w-full overflow-hidden rounded-lg border border-white/12 bg-black/40 ring-1 ring-white/10 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cartThumbnailSrc(video)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </Link>
                  </div>
                  <div className="mt-3 flex min-h-0 min-w-0 flex-1 flex-col">
                    <Link
                      href={`/video/${video.id}`}
                      className="line-clamp-2 text-left text-[15px] font-bold leading-snug text-zinc-100 transition-colors hover:text-[#ff0055] [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:text-[#ff0055] sm:text-[16px]"
                    >
                      {video.title}
                    </Link>
                    <p className="mt-2 min-h-0 truncate text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                      <Link
                        href={sellerProfileHrefFromVideo(video)}
                        className="text-inherit underline-offset-2 transition-colors hover:text-[#ff0055] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {video.creator}
                      </Link>
                    </p>
                    <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-white/10 pt-3 [html[data-theme='light']_&]:border-zinc-200">
                      {video.priceWon != null ? (
                        <span className="text-[15px] font-extrabold tabular-nums text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-[16px]">
                          {video.priceWon.toLocaleString("ko-KR")}원
                        </span>
                      ) : (
                        <span className="text-[14px] text-zinc-500">가격 문의</span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          removeBuilderItem(key);
                          setSelected((s) => {
                            const n = new Set(s);
                            n.delete(key);
                            return n;
                          });
                        }}
                        className="rounded-md px-2 py-1 text-[12px] font-medium text-zinc-500 underline-offset-2 hover:bg-white/10 hover:text-zinc-200 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-zinc-900"
                      >
                        삭제
                      </button>
                      {owned ? (
                        <Link
                          href={`/create?videoId=${encodeURIComponent(video.id)}`}
                          className="rounded-md px-2 py-1 text-[12px] font-semibold text-reels-cyan hover:bg-reels-cyan/10 hover:underline"
                        >
                          AI 창작하기
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <footer className="mt-8 border-t border-white/10 pt-6 [html[data-theme='light']_&]:border-zinc-200">
            <div className="flex flex-wrap items-end justify-end gap-x-5 gap-y-2 sm:gap-x-6">
              <div className="space-y-0.5 text-right">
                <p className="text-[15px] font-semibold leading-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                  합계
                </p>
                <p className="text-[14px] font-medium leading-tight text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                  {selected.size}개 선택
                </p>
              </div>
              <p
                className="text-4xl font-extrabold tabular-nums tracking-tight text-zinc-100 sm:text-5xl [html[data-theme='light']_&]:text-zinc-900"
                aria-live="polite"
                aria-label={`선택 합계 ${selectedTotal.toLocaleString("ko-KR")}원, ${selected.size}개`}
              >
                {selectedTotal.toLocaleString("ko-KR")}원
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                disabled
                className="inline-flex shrink-0 rounded-full border border-white/15 bg-white/[0.06] px-10 py-3 text-[17px] font-bold text-zinc-500 opacity-90 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-600"
              >
                결제
              </button>
            </div>
          </footer>
        </>
      )}
    </main>
  );
}

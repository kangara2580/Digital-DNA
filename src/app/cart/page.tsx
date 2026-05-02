"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDopamineBasket } from "@/context/DopamineBasketContext";
import { usePurchasedVideos } from "@/context/PurchasedVideosContext";
import { useAuthSession } from "@/hooks/useAuthSession";
import type { FeedVideo } from "@/data/videos";
import { sellerProfileHrefFromVideo } from "@/lib/sellerProfile";
import { sanitizePosterSrc } from "@/lib/videoPoster";

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

  return (
    <main className="mx-auto min-h-[50vh] max-w-[1800px] px-4 py-10 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:px-6 sm:py-12 lg:px-8">
      <header className="border-b border-white/10 pb-6 [html[data-theme='light']_&]:border-zinc-200">
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
          장바구니
        </h1>
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
        <div className="mx-auto mt-14 max-w-md space-y-4 sm:max-w-lg" aria-busy="true" aria-live="polite">
          <div className="mx-auto h-4 w-40 animate-pulse rounded bg-white/10 [html[data-theme='light']_&]:bg-zinc-200" />
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex gap-3 py-2 sm:gap-5"
              >
                <div className="h-[88px] w-[66px] shrink-0 animate-pulse rounded-lg bg-white/10 sm:h-[100px] sm:w-[75px] [html[data-theme='light']_&]:bg-zinc-200" />
                <div className="min-w-0 flex-1 space-y-2 pt-1">
                  <div className="h-4 w-[80%] max-w-sm animate-pulse rounded bg-white/10 [html[data-theme='light']_&]:bg-zinc-200" />
                  <div className="h-3 w-24 animate-pulse rounded bg-white/10 [html[data-theme='light']_&]:bg-zinc-200" />
                  <div className="h-3 w-32 animate-pulse rounded bg-white/10 [html[data-theme='light']_&]:bg-zinc-200" />
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
            className="mt-6 inline-flex rounded-full bg-reels-crimson px-5 py-2.5 text-[14px] font-extrabold text-white shadow-reels-crimson hover:brightness-110"
          >
            둘러보기
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 divide-y divide-white/10 [html[data-theme='light']_&]:divide-zinc-200">
            {builderItems.map(({ key, video }) => {
              const owned = hasPurchased(video.id);
              const checked = selected.has(key);
              return (
                <li
                  key={key}
                  className="flex gap-3 py-4 first:pt-0 sm:gap-5 sm:py-5"
                >
                  <label className="flex shrink-0 cursor-pointer items-start pt-1">
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
                    className="relative h-[88px] w-[66px] shrink-0 overflow-hidden rounded-lg border border-white/12 bg-black/40 sm:h-[100px] sm:w-[75px]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cartThumbnailSrc(video)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/video/${video.id}`}
                      className="line-clamp-2 text-left text-[15px] font-bold leading-snug text-zinc-100 transition-colors hover:text-[#ff0055] [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:text-[#ff0055]"
                    >
                      {video.title}
                    </Link>
                    <p className="mt-1 truncate text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                      <Link
                        href={sellerProfileHrefFromVideo(video)}
                        className="text-inherit underline-offset-2 transition-colors hover:text-[#ff0055] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {video.creator}
                      </Link>
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {video.priceWon != null ? (
                        <span className="text-[15px] font-extrabold tabular-nums text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
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
            <button
              type="button"
              disabled
              className="mt-6 w-full rounded-full border border-white/15 bg-white/[0.06] py-3.5 text-[15px] font-bold text-zinc-500 opacity-90 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-600"
            >
              결제 진행 (준비 중)
            </button>
          </footer>
        </>
      )}
    </main>
  );
}

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ShoppingCart } from "lucide-react";
import { CloneCountAnimation } from "@/components/CloneCountAnimation";
import { RelatedDnaQuilt } from "@/components/RelatedDnaQuilt";
import { useDopamineBasket } from "@/context/DopamineBasketContext";
import { usePurchasedVideos } from "@/context/PurchasedVideosContext";
import { useRecentClips } from "@/context/RecentClipsContext";
import type { FeedVideo } from "@/data/videos";
import {
  clonesRemaining,
  getCommerceMeta,
  getFreshnessForVideoId,
  isLimitedFamily,
} from "@/data/videoCommerce";

export function VideoDetailView({ video }: { video: FeedVideo }) {
  const dopamine = useDopamineBasket();
  const { hasPurchased, markPurchased } = usePurchasedVideos();
  const { recordView } = useRecentClips();
  const owned = hasPurchased(video.id);

  useEffect(() => {
    recordView(video.id);
  }, [video.id, recordView]);
  const meta = getCommerceMeta(video.id);
  const remaining = clonesRemaining(meta);
  const fresh = getFreshnessForVideoId(video.id);
  const price = video.priceWon ?? 0;
  const soldOut = remaining === 0 && isLimitedFamily(meta.edition);

  const ctaLabel =
    price === 100
      ? "[커피 한 잔보다 싼 영감 수집하기]"
      : soldOut
        ? "품절"
        : "바로 구매하기";

  return (
    <div className="min-h-screen bg-transparent text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 font-mono text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          <Link href="/" className="text-reels-cyan/90 hover:text-reels-cyan">
            홈
          </Link>
          <span className="mx-1.5 text-zinc-700 [html[data-theme='light']_&]:text-zinc-500">/</span>
          <span className="text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">조각 상세</span>
        </nav>

        <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
          <div className="min-w-0 flex-1">
            <div
              className={`reels-glass-card relative overflow-hidden rounded-xl ${
                video.orientation === "portrait"
                  ? "mx-auto max-w-md aspect-[3/4]"
                  : "aspect-video w-full"
              }`}
            >
              <video
                className="h-full w-full object-cover"
                poster={video.poster}
                src={video.src}
                controls
                playsInline
                preload="metadata"
              />
            </div>
            <p className="mt-3 text-center font-mono text-[10px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              Cloned:{" "}
              <span className="text-reels-cyan">
                <CloneCountAnimation value={meta.salesCount} />
              </span>{" "}
              times · 복제 지수
            </p>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-6 lg:max-w-md">
            <div>
              {fresh.label ? (
                <span className="mb-2 inline-block rounded border border-reels-crimson/35 bg-reels-crimson/10 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-reels-crimson">
                  {fresh.label}
                </span>
              ) : null}
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100 sm:text-3xl [html[data-theme='light']_&]:text-zinc-900">
                {video.title}
              </h1>
              <p className="mt-1 text-[14px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">{video.creator}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">{fresh.subline}</p>
            </div>

            <div className="border-t border-white/10 pt-6 [html[data-theme='light']_&]:border-zinc-200">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[22px] font-extrabold tabular-nums text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                  {price > 0 ? `${price.toLocaleString("ko-KR")}원` : "가격 문의"}
                </p>
                <button
                  type="button"
                  title="장바구니 담기"
                  onClick={(e) => {
                    if (soldOut) return;
                    dopamine.launchFromCartButton(e.currentTarget, video, video.poster);
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-zinc-200 transition-colors hover:border-reels-cyan/40 hover:text-reels-cyan disabled:cursor-not-allowed disabled:opacity-40 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-800"
                  disabled={soldOut}
                  aria-label="장바구니 담기"
                >
                  <ShoppingCart className="h-4 w-4" />
                </button>
              </div>
            </div>

            <section
              className="reels-glass-card rounded-xl p-5"
              aria-labelledby="license-heading"
            >
              <h2
                id="license-heading"
                className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600"
              >
                소유 방식 · License Type
              </h2>
              {meta.edition === "open" ? (
                <p className="mt-3 text-[13px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-700">
                  이미{" "}
                  <span className="font-bold text-reels-cyan">
                    {meta.salesCount.toLocaleString("ko-KR")}명
                  </span>
                  의 크리에이터가 수집한 검증된 도파민 이것도 조각이에요.
                  <br />
                  유튜브 배경·브이로그에 가볍게
                  얹어 보세요.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {soldOut ? (
                    <p className="text-[14px] font-bold text-zinc-200">
                      남은 수량:{" "}
                      <span className="text-reels-crimson">0개 — 소장이 마감되었어요</span>
                    </p>
                  ) : (
                    <p className="text-[14px] text-zinc-300">
                      남은 수량:{" "}
                      <span className="text-lg font-extrabold tabular-nums text-reels-cyan">
                        {remaining?.toLocaleString("ko-KR")}개
                      </span>
                    </p>
                  )}
                  <p className="text-[12px] leading-relaxed text-zinc-500">
                    {meta.edition === "private"
                      ? "결제가 완료되면 목록에서 내려가며, 한 명만 독점 소유할 수 있어요."
                      : "전 세계에서 정해진 인원만 같은 감성을 소장할 수 있어요."}
                  </p>
                </div>
              )}
            </section>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <button
                type="button"
                disabled={soldOut}
                onClick={() => {
                  if (!soldOut && !owned) markPurchased(video.id);
                }}
                className="w-full rounded-full bg-reels-crimson px-5 py-3.5 text-[14px] font-extrabold text-white shadow-reels-crimson transition-[transform,opacity] duration-300 ease-in-out hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-1"
              >
                {ctaLabel}
              </button>
              {!soldOut && !owned ? (
                <button
                  type="button"
                  onClick={() => markPurchased(video.id)}
                  className="w-full rounded-full border border-white/20 bg-white/[0.06] px-5 py-3.5 text-[14px] font-extrabold text-zinc-100 transition-colors hover:border-reels-cyan/40 hover:bg-white/10 sm:flex-1"
                >
                  모션 권한 구매(데모)
                </button>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              {!owned ? (
                <p className="text-center text-[11px] text-zinc-500">
                  결제 연동 전에는 「모션 권한 구매(데모)」로 창작 버튼을 켤 수 있어요.
                </p>
              ) : null}
              {owned ? (
                <Link
                  href={`/create?videoId=${encodeURIComponent(video.id)}`}
                  className="flex w-full items-center justify-center rounded-full border border-reels-cyan/40 bg-reels-cyan/10 px-5 py-3.5 text-center text-[14px] font-extrabold text-reels-cyan shadow-[0_0_24px_-8px_rgba(0,242,234,0.35)] transition-[transform,opacity] duration-300 hover:bg-reels-cyan/18"
                >
                  AI 창작 ○ 편집
                </Link>
              ) : (
                <div
                  className="flex w-full cursor-not-allowed items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-5 py-3.5 text-center text-[14px] font-extrabold text-zinc-500"
                  aria-disabled
                  title="먼저 모션 권한을 구매해 주세요"
                >
                  AI 창작 ○ 편집 (구매 후 활성화)
                </div>
              )}
            </div>

            <div className="pt-1">
              <RelatedDnaQuilt video={video} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

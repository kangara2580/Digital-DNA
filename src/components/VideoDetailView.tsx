"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { CloneCountAnimation } from "@/components/CloneCountAnimation";
import { KlingReskinStudio } from "@/components/KlingReskinStudio";
import { RelatedDnaQuilt } from "@/components/RelatedDnaQuilt";
import { useDopamineBasket } from "@/context/DopamineBasketContext";
import { useRecentClips } from "@/context/RecentClipsContext";
import type { FeedVideo } from "@/data/videos";
import {
  clonesRemaining,
  getCommerceMeta,
  getFreshnessForVideoId,
  isLimitedFamily,
} from "@/data/videoCommerce";

function editionTitleKo(meta: ReturnType<typeof getCommerceMeta>): string {
  switch (meta.edition) {
    case "open":
      return "무제한 판매 (Open Edition)";
    case "limited":
      return "한정 판매 (Limited)";
    case "private":
      return "1인 독점 (Private)";
    case "batch":
      return `${meta.editionCap ?? "?"}명 한정 (Batch)`;
    default:
      return "판매 방식";
  }
}

export function VideoDetailView({ video }: { video: FeedVideo }) {
  const dopamine = useDopamineBasket();
  const { recordView } = useRecentClips();
  const ctaRef = useRef<HTMLButtonElement>(null);

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
        : "장바구니에 담기";

  return (
    <div className="min-h-screen bg-reels-abyss text-zinc-100">
      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 font-mono text-[11px] text-zinc-500">
          <Link href="/" className="text-reels-cyan/90 hover:text-reels-cyan">
            홈
          </Link>
          <span className="mx-1.5 text-zinc-700">/</span>
          <span className="text-zinc-400">조각 상세</span>
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
            <p className="mt-3 text-center font-mono text-[10px] text-zinc-500">
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
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100 sm:text-3xl">
                {video.title}
              </h1>
              <p className="mt-1 text-[14px] text-zinc-400">{video.creator}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">{fresh.subline}</p>
            </div>

            <div className="border-t border-white/10 pt-6">
              <p className="font-mono text-[22px] font-extrabold tabular-nums text-zinc-100">
                {price > 0 ? `${price.toLocaleString("ko-KR")}원` : "가격 문의"}
              </p>
            </div>

            <section
              className="reels-glass-card rounded-xl p-5"
              aria-labelledby="license-heading"
            >
              <h2
                id="license-heading"
                className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500"
              >
                소유 방식 · License Type
              </h2>
              <p className="mt-2 text-[15px] font-bold text-zinc-100">{editionTitleKo(meta)}</p>

              {meta.edition === "open" ? (
                <p className="mt-3 text-[13px] leading-relaxed text-zinc-400">
                  이미{" "}
                  <span className="font-bold text-reels-cyan">
                    {meta.salesCount.toLocaleString("ko-KR")}명
                  </span>
                  의 크리에이터가 수집한 검증된 도파민 조각이에요. 유튜브 배경·브이로그에 가볍게
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

            <button
              ref={ctaRef}
              type="button"
              disabled={soldOut}
              onClick={() => {
                const el = ctaRef.current;
                if (el && !soldOut) {
                  dopamine.launchFromCartButton(el, video, video.poster);
                }
              }}
              className="w-full rounded-full bg-reels-crimson px-5 py-3.5 text-[14px] font-extrabold text-white shadow-reels-crimson transition-[transform,opacity] duration-300 ease-in-out hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {ctaLabel}
            </button>

            <div className="pt-1">
              <RelatedDnaQuilt video={video} />
            </div>
          </div>
        </div>

        <KlingReskinStudio video={video} />
      </div>
    </div>
  );
}

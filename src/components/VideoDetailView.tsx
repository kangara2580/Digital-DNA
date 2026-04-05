"use client";

import Link from "next/link";
import { useRef } from "react";
import { CloneCountAnimation } from "@/components/CloneCountAnimation";
import { RelatedDnaQuilt } from "@/components/RelatedDnaQuilt";
import { useDopamineBasket } from "@/context/DopamineBasketContext";
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
  const ctaRef = useRef<HTMLButtonElement>(null);
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
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 font-mono text-[11px] text-slate-500">
          <Link href="/" className="hover:text-slate-800">
            홈
          </Link>
          <span className="mx-1.5 text-slate-300">/</span>
          <span className="text-slate-700">조각 상세</span>
        </nav>

        <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
          <div className="min-w-0 flex-1">
            <div
              className={`relative overflow-hidden rounded-xl border border-[#e5e7eb] bg-slate-100 [border-width:0.5px] ${
                video.orientation === "portrait"
                  ? "mx-auto max-w-md aspect-[4/5]"
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
            <p className="mt-3 text-center font-mono text-[10px] text-slate-500">
              Cloned:{" "}
              <CloneCountAnimation value={meta.salesCount} /> times · 복제 지수
            </p>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-6 lg:max-w-md">
            <div>
              {fresh.label ? (
                <span className="mb-2 inline-block rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-slate-600">
                  {fresh.label}
                </span>
              ) : null}
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                {video.title}
              </h1>
              <p className="mt-1 text-[14px] text-slate-600">{video.creator}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-slate-500">{fresh.subline}</p>
            </div>

            <div className="border-t border-[#e5e7eb] pt-6 [border-top-width:0.5px]">
              <p className="font-mono text-[22px] font-semibold tabular-nums text-slate-900">
                {price > 0 ? `${price.toLocaleString("ko-KR")}원` : "가격 문의"}
              </p>
            </div>

            <section
              className="rounded-xl border border-[#e5e7eb] bg-white p-5 [border-width:0.5px]"
              aria-labelledby="license-heading"
            >
              <h2
                id="license-heading"
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500"
              >
                소유 방식 · License Type
              </h2>
              <p className="mt-2 text-[15px] font-semibold text-slate-900">{editionTitleKo(meta)}</p>

              {meta.edition === "open" ? (
                <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
                  이미{" "}
                  <span className="font-semibold text-slate-900">
                    {meta.salesCount.toLocaleString("ko-KR")}명
                  </span>
                  의 크리에이터가 수집한 검증된 도파민 조각이에요. 유튜브 배경·브이로그에 가볍게
                  얹어 보세요.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {soldOut ? (
                    <p className="text-[14px] font-semibold text-slate-900">
                      남은 수량:{" "}
                      <span className="text-red-600">0개 — 소장이 마감되었어요</span>
                    </p>
                  ) : (
                    <p className="text-[14px] text-slate-800">
                      남은 수량:{" "}
                      <span className="text-lg font-bold tabular-nums text-slate-900">
                        {remaining?.toLocaleString("ko-KR")}개
                      </span>
                    </p>
                  )}
                  <p className="text-[12px] leading-relaxed text-slate-500">
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
              className="w-full rounded-full bg-slate-900 px-5 py-3.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {ctaLabel}
            </button>

            <div className="pt-1">
              <RelatedDnaQuilt video={video} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

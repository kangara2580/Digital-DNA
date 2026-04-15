"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Film, Sparkles, Wallet } from "lucide-react";
import { usePurchasedVideos } from "@/context/PurchasedVideosContext";
import { ALL_MARKET_VIDEOS } from "@/data/videoCatalog";
import { SUBSCRIPTION_CHECKOUT_PLANS } from "@/data/subscriptionCheckout";
import { readDnaCredits } from "@/lib/dnaCreditsStorage";
import { readStoredSubscription } from "@/lib/subscriptionStorage";

function formatNextRenewal(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return "—";
  }
}

export function MyPageAccountOverview() {
  const { hasPurchased } = usePurchasedVideos();
  const [credits, setCredits] = useState(0);
  const [sub, setSub] = useState(() => readStoredSubscription());

  useEffect(() => {
    const sync = () => {
      setCredits(readDnaCredits());
      setSub(readStoredSubscription());
    };
    sync();
    window.addEventListener("reels-dna-credits-updated", sync);
    window.addEventListener("reels-subscription-updated", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("reels-dna-credits-updated", sync);
      window.removeEventListener("reels-subscription-updated", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const purchasedVideos = useMemo(() => {
    return ALL_MARKET_VIDEOS.filter((v) => hasPurchased(v.id));
  }, [hasPurchased]);

  const monthlyBudget = useMemo(() => {
    if (!sub) return 250;
    return SUBSCRIPTION_CHECKOUT_PLANS[sub.planKey]?.dnaCreditsPerMonth ?? 250;
  }, [sub]);

  const pctRemaining = useMemo(() => {
    const cap = Math.max(1, monthlyBudget);
    return Math.min(100, Math.round((credits / cap) * 100));
  }, [credits, monthlyBudget]);

  const overMonthlyRef = credits > monthlyBudget;

  const isCriticalLow = !overMonthlyRef && pctRemaining <= 10;
  const isLow = !overMonthlyRef && pctRemaining <= 20;

  return (
    <div className="mb-6 grid gap-4 lg:grid-cols-3">
      <section className="rounded-2xl border border-white/10 bg-black/25 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-reels-cyan" aria-hidden />
          <h3 className="text-[13px] font-extrabold [html[data-theme='light']_&]:text-zinc-900">
            나의 구독
          </h3>
        </div>
        {sub ? (
          <>
            <p className="mt-2 text-[15px] font-bold [html[data-theme='light']_&]:text-zinc-900">
              {sub.planLabel}
            </p>
            <p className="mt-1 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              다음 갱신 {formatNextRenewal(sub.nextRenewalIso)}
            </p>
          </>
        ) : (
          <p className="mt-2 text-[13px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            이용 중인 구독이 없습니다.
          </p>
        )}
        <Link
          href="/subscribe"
          className="mt-3 inline-block text-[12px] font-semibold text-reels-cyan hover:underline"
        >
          구독 플랜 보기
        </Link>
      </section>

      <section
        className={`rounded-2xl border bg-black/25 p-4 [html[data-theme='light']_&]:bg-zinc-50 ${
          isCriticalLow
            ? "border-reels-crimson/45 ring-1 ring-reels-crimson/20"
            : isLow
              ? "border-amber-400/35 ring-1 ring-amber-400/15"
              : "border-white/10 [html[data-theme='light']_&]:border-zinc-200"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-reels-cyan" aria-hidden />
            <h3 className="text-[13px] font-extrabold [html[data-theme='light']_&]:text-zinc-900">
              비주얼 크레딧
            </h3>
          </div>
          <span className="text-[20px] font-black tabular-nums text-reels-cyan">
            {credits.toLocaleString("ko-KR")}
          </span>
        </div>

        <div
          className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/10 [html[data-theme='light']_&]:bg-zinc-200"
          role="progressbar"
          aria-valuenow={pctRemaining}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`플랜 기준 대비 약 ${pctRemaining}퍼센트 남음`}
        >
          <div
            className={`h-full rounded-full transition-[width] duration-500 ease-out ${
              isCriticalLow
                ? "bg-gradient-to-r from-reels-crimson to-orange-500"
                : isLow
                  ? "bg-gradient-to-r from-amber-400 to-reels-cyan/90"
                  : "bg-gradient-to-r from-reels-cyan/95 to-reels-cyan/60"
            }`}
            style={{ width: `${pctRemaining}%` }}
          />
        </div>

        <p className="mt-2 text-[12px] font-semibold leading-snug text-zinc-200 [html[data-theme='light']_&]:text-zinc-800">
          {overMonthlyRef ? (
            <>
              보유량이 이번 달 기준({monthlyBudget.toLocaleString("ko-KR")})을 넘겨 여유가 충분해요. 다음 갱신 전까지
              마음껏 쓰셔도 됩니다.
            </>
          ) : isCriticalLow ? (
            <>
              이번 달 크레딧이 <span className="text-reels-crimson">{pctRemaining}%</span> 남았습니다!{" "}
              충전하시겠어요?
            </>
          ) : isLow ? (
            <>
              여유가 <span className="text-amber-300 [html[data-theme='light']_&]:text-amber-700">{pctRemaining}%</span>{" "}
              정도예요. 미리 충전해 두면 안심이에요.
            </>
          ) : (
            <>
              플랜 월 {monthlyBudget.toLocaleString("ko-KR")} 기준으로 약{" "}
              <span className="text-reels-cyan">{pctRemaining}%</span> 남은 비율이에요.
            </>
          )}
        </p>

        <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          AI 얼굴·배경 생성에 사용됩니다. 막대는 월 지급분(미구독 시 250 기준) 대비 보유량 비율입니다.
        </p>

        <Link
          href="/subscribe"
          className={`mt-3 inline-flex w-full items-center justify-center rounded-xl px-3 py-2 text-center text-[12px] font-extrabold transition ${
            isCriticalLow || isLow
              ? "border border-reels-crimson/50 bg-reels-crimson/15 text-reels-crimson hover:bg-reels-crimson/25"
              : "border border-reels-cyan/40 bg-reels-cyan/10 text-reels-cyan hover:bg-reels-cyan/18"
          }`}
        >
          크레딧 충전 · 플랜 보기
        </Link>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/25 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-reels-cyan" aria-hidden />
          <h3 className="text-[13px] font-extrabold [html[data-theme='light']_&]:text-zinc-900">
            구매한 동영상
          </h3>
        </div>
        {purchasedVideos.length === 0 ? (
          <p className="mt-2 text-[13px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            아직 구매한 영상이 없습니다.
          </p>
        ) : (
          <ul className="mt-2 max-h-28 space-y-1.5 overflow-y-auto pr-1 text-[13px]">
            {purchasedVideos.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/video/${v.id}`}
                  className="font-medium text-zinc-200 hover:text-reels-cyan [html[data-theme='light']_&]:text-zinc-800"
                >
                  {v.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/explore"
          className="mt-3 inline-block text-[12px] font-semibold text-reels-cyan hover:underline"
        >
          마켓 둘러보기
        </Link>
      </section>
    </div>
  );
}

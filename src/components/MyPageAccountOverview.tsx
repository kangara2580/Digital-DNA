"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Film, Sparkles, Wallet } from "lucide-react";
import { usePurchasedVideos } from "@/context/PurchasedVideosContext";
import { ALL_MARKET_VIDEOS } from "@/data/videoCatalog";
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

      <section className="rounded-2xl border border-white/10 bg-black/25 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-reels-cyan" aria-hidden />
          <h3 className="text-[13px] font-extrabold [html[data-theme='light']_&]:text-zinc-900">
            보유 DNA 크레딧
          </h3>
        </div>
        <p className="mt-2 text-[22px] font-black tabular-nums text-reels-cyan">
          {credits.toLocaleString("ko-KR")}
        </p>
        <p className="mt-1 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          AI 얼굴·배경 등에 사용됩니다.
        </p>
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

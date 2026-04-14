import Link from "next/link";
import { CreditCard, Sparkles } from "lucide-react";

export const metadata = {
  title: "구독·결제 — REELS MARKET",
  description:
    "구독 플랜과 카드 등록 후 이용 시점 결제를 한곳에서 안내합니다.",
};

const cardShell =
  "relative overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br from-zinc-900/95 via-reels-void/90 to-reels-cyan/[0.08] px-6 py-9 text-left sm:px-8 sm:py-10 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:from-white [html[data-theme='light']_&]:via-zinc-50 [html[data-theme='light']_&]:to-reels-cyan/10";

const glow =
  "pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-reels-cyan/20 blur-3xl [html[data-theme='light']_&]:bg-reels-cyan/15";

export default function SubscribePage() {
  return (
    <div className="min-h-[calc(100dvh-var(--header-height,4.5rem))] text-[var(--foreground,#fafafa)] [html[data-theme='light']_&]:bg-white [html[data-theme='dark']_&]:bg-transparent">
      <main className="mx-auto flex max-w-4xl flex-col px-4 py-8 sm:px-6 sm:py-12">
        <nav className="mb-8 font-mono text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          <Link href="/" className="text-reels-cyan/90 hover:text-reels-cyan">
            홈
          </Link>
          <span className="mx-1.5 text-zinc-700 [html[data-theme='light']_&]:text-zinc-500">/</span>
          <span className="text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">구독</span>
        </nav>

        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          {/* 구독 서비스 */}
          <section className={cardShell} aria-labelledby="subscribe-service-heading">
            <div className={glow} aria-hidden />
            <p className="relative font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-reels-cyan/90">
              구독 서비스
            </p>
            <div className="relative mt-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-reels-cyan/35 bg-reels-cyan/10 text-reels-cyan">
              <Sparkles className="h-6 w-6" strokeWidth={1.75} aria-hidden />
            </div>
            <h1
              id="subscribe-service-heading"
              className="relative mt-4 text-xl font-black leading-snug tracking-tight sm:text-2xl [html[data-theme='light']_&]:text-zinc-900"
            >
              월 구독 혜택을 받아보세요
            </h1>
            <div className="relative mt-8 flex flex-col gap-2">
              <button
                type="button"
                disabled
                className="w-full rounded-2xl border border-reels-cyan/45 bg-reels-cyan/15 py-3.5 text-[15px] font-extrabold text-reels-cyan shadow-[0_0_24px_-10px_rgba(0,242,234,0.35)] [html[data-theme='light']_&]:text-[#047857] disabled:cursor-not-allowed disabled:opacity-80"
                aria-disabled="true"
              >
                구독 플랜 선택하기
              </button>
              <p className="text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                구독 빌링(PG) 연동 후 활성화됩니다.
              </p>
            </div>
          </section>

          {/* 카드 등록 · 즉시 결제 */}
          <section className={cardShell} aria-labelledby="subscribe-card-heading">
            <div className={glow} aria-hidden />
            <p className="relative font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-reels-cyan/90">
              카드 등록 · 바로 결제
            </p>
            <div className="relative mt-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-reels-cyan/35 bg-reels-cyan/10 text-reels-cyan">
              <CreditCard className="h-6 w-6" strokeWidth={1.75} aria-hidden />
            </div>
            <h2
              id="subscribe-card-heading"
              className="relative mt-4 text-xl font-black leading-snug tracking-tight sm:text-2xl [html[data-theme='light']_&]:text-zinc-900"
            >
              카드 한 번 등록, 이용할 때마다 결제
            </h2>
            <div className="relative mt-8 flex flex-col gap-2">
              <button
                type="button"
                disabled
                className="w-full rounded-2xl border border-reels-cyan/50 bg-reels-cyan py-3.5 text-[15px] font-extrabold text-reels-void shadow-[0_0_32px_-8px_rgba(0,242,234,0.45)] [html[data-theme='light']_&]:text-[#041016] disabled:cursor-not-allowed disabled:opacity-85"
                aria-disabled="true"
              >
                카드 등록하기
              </button>
              <p className="text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                PG 연동 후 바로 등록·결제할 수 있어요.
              </p>
            </div>
          </section>
        </div>

        <ul className="mt-10 space-y-2 text-[13px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          <li className="flex gap-2">
            <span className="font-bold text-reels-cyan/90">·</span>
            <span>구독과 카드 결제는 서로 다른 결제 흐름이며, 오픈 순서에 따라 단계적으로 켜집니다.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-reels-cyan/90">·</span>
            <span>카드 정보는 결제사 규정에 따라 안전하게 저장·과금됩니다.</span>
          </li>
        </ul>

        <p className="mt-10 text-center">
          <Link
            href="/contact"
            className="text-[14px] font-semibold text-reels-cyan hover:underline"
          >
            도입·제휴 문의
          </Link>
          <span className="mx-2 text-zinc-600">·</span>
          <Link href="/" className="text-[14px] font-semibold text-zinc-500 hover:text-reels-cyan [html[data-theme='light']_&]:text-zinc-600">
            홈
          </Link>
        </p>
      </main>
    </div>
  );
}

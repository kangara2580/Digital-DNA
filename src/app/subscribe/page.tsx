import Link from "next/link";
import { CreditCard } from "lucide-react";

export const metadata = {
  title: "구독·결제 — REELS MARKET",
  description:
    "카드를 한 번만 등록하면 구독·이용 금액이 실시간으로 안전하게 청구됩니다.",
};

export default function SubscribePage() {
  return (
    <div className="min-h-[calc(100dvh-var(--header-height,4.5rem))] text-[var(--foreground,#fafafa)] [html[data-theme='light']_&]:bg-white [html[data-theme='dark']_&]:bg-transparent">
      <main className="mx-auto flex max-w-lg flex-col px-4 py-8 sm:px-6 sm:py-12">
        <nav className="mb-8 font-mono text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          <Link href="/" className="text-reels-cyan/90 hover:text-reels-cyan">
            홈
          </Link>
          <span className="mx-1.5 text-zinc-700 [html[data-theme='light']_&]:text-zinc-500">/</span>
          <span className="text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">구독</span>
        </nav>

        <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br from-zinc-900/95 via-reels-void/90 to-reels-cyan/[0.12] px-6 py-10 text-center sm:px-10 sm:py-12 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:from-white [html[data-theme='light']_&]:via-zinc-50 [html[data-theme='light']_&]:to-reels-cyan/10">
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-reels-cyan/25 blur-3xl"
            aria-hidden
          />
          <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-reels-cyan/35 bg-reels-cyan/10 text-reels-cyan">
            <CreditCard className="h-7 w-7" strokeWidth={1.75} aria-hidden />
          </div>
          <h1 className="relative mt-5 text-2xl font-black leading-tight tracking-tight sm:text-3xl [html[data-theme='light']_&]:text-zinc-900">
            구독으로 이용하고, 카드로 바로 결제
          </h1>
          <p className="relative mt-3 text-[15px] font-medium leading-snug text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            정액 충전 없이, 등록한 카드에서 이용 시점에 실시간 청구됩니다.
          </p>

          <div className="relative mt-8 flex flex-col gap-3">
            <button
              type="button"
              disabled
              className="w-full rounded-2xl border border-reels-cyan/50 bg-reels-cyan py-4 text-[16px] font-extrabold text-reels-void shadow-[0_0_32px_-8px_rgba(0,242,234,0.45)] [html[data-theme='light']_&]:text-[#041016] disabled:cursor-not-allowed disabled:opacity-85"
              aria-disabled="true"
            >
              카드 등록하고 구독 시작
            </button>
            <p className="text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              PG·구독 빌링 연동 후 바로 이용할 수 있어요.
            </p>
          </div>
        </div>

        <ul className="mt-8 space-y-2 text-[13px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          <li className="flex gap-2">
            <span className="font-bold text-reels-cyan/90">·</span>
            <span>월 구독 또는 이용량 기준 과금 등 상세 플랜은 오픈 시 이 페이지에 안내됩니다.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-reels-cyan/90">·</span>
            <span>카드 정보는 결제사 규정에 따라 저장·과금됩니다.</span>
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

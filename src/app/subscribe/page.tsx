import Link from "next/link";
import {
  Check,
  CreditCard,
} from "lucide-react";

export const metadata = {
  title: "구독·결제 — ARA",
  description:
    "구독 플랜과 카드 등록 후 이용 시점 결제를 한곳에서 안내합니다.",
};

const plans = [
  {
    planKey: "starter" as const,
    tier: "Starter",
    badge: "입문자",
    price: "$19 ~ $29 / 월",
    discount: "영상 구매 10% 할인",
    credits: "월 100 Credits",
    aiFeature: "배경 제거 5회 + 워터마크 없는 저장 시작",
    cta: "Starter 선택하기",
    highlight: false,
  },
  {
    planKey: "creator" as const,
    tier: "Creator",
    badge: "추천",
    price: "$49 ~ $59 / 월",
    discount: "영상 구매 25% 할인",
    credits: "월 300 Credits",
    aiFeature: "얼굴/배경 생성 + 편집 기능 본격 오픈",
    cta: "Creator 선택하기",
    highlight: true,
  },
  {
    planKey: "pro" as const,
    tier: "Pro / Business",
    badge: "고성능",
    price: "$149+ / 커스텀",
    discount: "영상 구매 40% 할인",
    credits: "월 1,000 Credits",
    aiFeature: "상업용 대량 처리 + 팀 단위 운영",
    cta: "Pro 선택하기",
    highlight: false,
  },
];

export default function SubscribePage() {
  return (
    <div className="min-h-[calc(100dvh-var(--header-height,4.5rem))] text-[var(--foreground,#fafafa)] [html[data-theme='light']_&]:bg-white [html[data-theme='dark']_&]:bg-transparent">
      <main className="mx-auto flex max-w-6xl flex-col px-4 py-8 sm:px-6 sm:py-12">
        <nav className="mb-8 font-mono text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          <Link href="/" className="text-reels-cyan/90 hover:text-reels-cyan">
            홈
          </Link>
          <span className="mx-1.5 text-zinc-700 [html[data-theme='light']_&]:text-zinc-500">/</span>
          <span className="text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">구독</span>
        </nav>

        <div className="mb-5 flex justify-end">
          <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-black/30 px-4 py-3 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
            <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-reels-cyan/20 blur-2xl [html[data-theme='light']_&]:bg-reels-cyan/15" aria-hidden />
            <div className="relative flex items-center gap-3">
              <p className="hidden text-right text-[11px] font-medium text-zinc-400 [html[data-theme='light']_&]:text-zinc-600 sm:block">
                단건 구매가 필요하다면 카드만 간편 등록
              </p>
              <Link
                href="/subscribe/checkout?mode=register-card"
                className="inline-flex items-center gap-2 rounded-xl border border-reels-cyan/55 bg-reels-cyan/90 px-4 py-2 text-[13px] font-bold text-reels-void shadow-[0_0_24px_-12px_rgba(0,242,234,0.65)] transition hover:brightness-110"
              >
                <CreditCard className="h-4 w-4" aria-hidden />
                카드 등록하기
              </Link>
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3" aria-label="구독 플랜 목록">
          {plans.map((plan) => (
            <article
              key={plan.tier}
              className={`reels-glass-card rounded-3xl border p-6 ${
                plan.highlight
                  ? "border-reels-cyan/70 bg-reels-cyan/[0.08] shadow-[0_0_38px_-22px_rgba(0,242,234,0.8)]"
                  : "border-white/12 bg-black/30 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xl font-black [html[data-theme='light']_&]:text-zinc-900">{plan.tier}</p>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    plan.highlight
                      ? "bg-reels-cyan text-reels-void"
                      : "border border-reels-cyan/40 bg-reels-cyan/10 text-reels-cyan"
                  }`}
                >
                  {plan.badge}
                </span>
              </div>
              <p className="mt-4 text-2xl font-black tracking-tight [html[data-theme='light']_&]:text-zinc-900">{plan.price}</p>
              <ul className="mt-5 space-y-2.5 text-[13px] text-zinc-200 [html[data-theme='light']_&]:text-zinc-700">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-reels-cyan" aria-hidden />
                  <span>{plan.discount}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-reels-cyan" aria-hidden />
                  <span>{plan.credits}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-reels-cyan" aria-hidden />
                  <span>{plan.aiFeature}</span>
                </li>
              </ul>
              <Link
                href={`/subscribe/checkout?plan=${plan.planKey}`}
                className={`mt-6 flex w-full items-center justify-center rounded-2xl py-3 text-[14px] font-extrabold transition hover:brightness-110 ${
                  plan.highlight
                    ? "bg-reels-cyan text-reels-void shadow-[0_0_30px_-10px_rgba(0,242,234,0.6)]"
                    : "border border-reels-cyan/45 bg-reels-cyan/15 text-reels-cyan"
                }`}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </section>

        <ul className="mt-10 space-y-2 text-[13px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          <li className="flex gap-2">
            <span className="font-bold text-reels-cyan/90">·</span>
            <span>결제 정보는 결제사 규정에 따라 안전하게 저장·과금되며, 정책 고지와 실제 동작을 동일하게 유지합니다.</span>
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

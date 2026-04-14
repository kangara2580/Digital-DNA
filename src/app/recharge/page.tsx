import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Coins,
  CreditCard,
  HelpCircle,
  Shield,
  Sparkles,
  Wallet,
} from "lucide-react";

export const metadata = {
  title: "정액충전 — REELS MARKET",
  description:
    "리스킨·구매에 쓸 크레딧을 미리 충전하세요. 정액충전으로 결제를 빠르고 안전하게.",
};

const tiers = [
  {
    amount: 10_000,
    label: "입문",
    bonus: null,
    popular: false,
  },
  {
    amount: 30_000,
    label: "일반",
    bonus: "3% 보너스",
    popular: true,
  },
  {
    amount: 50_000,
    label: "스탠다드",
    bonus: "5% 보너스",
    popular: false,
  },
  {
    amount: 100_000,
    label: "프로",
    bonus: "8% 보너스",
    popular: false,
  },
] as const;

const steps = [
  {
    n: "01",
    title: "금액 선택",
    body: "원하는 정액 충전 플랜을 고릅니다. 보너스가 있는 구간은 크레딧이 더 붙어요.",
  },
  {
    n: "02",
    title: "결제·입금",
    body: "카드·간편결제 또는 안내에 따른 가상계좌 입금으로 충전을 완료합니다.",
  },
  {
    n: "03",
    title: "크레딧 반영",
    body: "확인 즉시 계정에 충전 크레딧이 반영되며, 마이페이지에서 잔액을 확인할 수 있어요.",
  },
  {
    n: "04",
    title: "바로 사용",
    body: "DNA 구매, 리스킨, 프리뷰 등 서비스 전역에서 크레딧으로 결제합니다.",
  },
] as const;

const faqs = [
  {
    q: "정액충전과 건별 결제는 무엇이 다른가요?",
    a: "정액충전은 미리 잔액을 넣어 두고, 이후 결제마다 카드 정보를 반복 입력하지 않아도 됩니다. 보너스 정책이 적용되는 구간도 있습니다.",
  },
  {
    q: "충전한 크레딧은 환불되나요?",
    a: "미사용 잔액에 대한 환불 조건은 이용약관 및 정책에 따릅니다. 상세는 고객센터로 문의해 주세요.",
  },
  {
    q: "유효기간이 있나요?",
    a: "정책에 따라 유효기간이 부여될 수 있습니다. 최종 기준은 서비스 내 안내 및 약관을 확인해 주세요.",
  },
] as const;

export default function RechargePage() {
  return (
    <div className="min-h-[calc(100dvh-var(--header-height,4.5rem))] text-[var(--foreground,#fafafa)] [html[data-theme='light']_&]:bg-white [html[data-theme='dark']_&]:bg-transparent">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:max-w-5xl">
        <nav className="mb-8 font-mono text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          <Link href="/" className="text-reels-cyan/90 hover:text-reels-cyan">
            홈
          </Link>
          <span className="mx-1.5 text-zinc-700 [html[data-theme='light']_&]:text-zinc-500">/</span>
          <span className="text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">정액충전</span>
        </nav>

        {/* 히어로 */}
        <header className="relative overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br from-zinc-900/95 via-reels-void/90 to-reels-cyan/[0.14] px-6 py-10 sm:px-10 sm:py-12 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:from-white [html[data-theme='light']_&]:via-zinc-50 [html[data-theme='light']_&]:to-reels-cyan/12">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-reels-cyan/30 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-reels-crimson/15 blur-3xl"
            aria-hidden
          />
          <p className="relative inline-flex items-center gap-2 rounded-full border border-reels-cyan/35 bg-black/25 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-reels-cyan [html[data-theme='light']_&]:bg-white/80">
            <Wallet className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            prepaid balance
          </p>
          <h1 className="relative mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-[2.75rem]">
            <span className="bg-gradient-to-r from-white via-zinc-100 to-reels-cyan/95 bg-clip-text text-transparent [html[data-theme='light']_&]:from-zinc-900 [html[data-theme='light']_&]:via-zinc-800 [html[data-theme='light']_&]:to-reels-cyan">
              정액충전으로
            </span>
            <br />
            <span className="bg-gradient-to-r from-reels-cyan via-teal-200 to-zinc-300 bg-clip-text text-transparent [html[data-theme='light']_&]:from-reels-cyan [html[data-theme='light']_&]:via-teal-700 [html[data-theme='light']_&]:to-zinc-700">
              크레딧을 미리 채워 두세요
            </span>
          </h1>
          <p className="relative mt-4 max-w-2xl text-[15px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            조각 구매·Kling 리스킨·프리뷰 등에 쓸 금액을 한 번에 충전해 두면, 매번 결제 정보를 입력하지 않아도 됩니다.
            정해진 금액대별 보너스로 더 유리하게 이용할 수 있어요.
          </p>
        </header>

        {/* 왜 정액충전인지 */}
        <section className="mt-12 sm:mt-16" aria-labelledby="recharge-why">
          <h2
            id="recharge-why"
            className="text-xl font-extrabold tracking-tight [html[data-theme='light']_&]:text-zinc-900 sm:text-2xl"
          >
            정액충전을 쓰면 좋은 이유
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            <li className="reels-glass-card rounded-2xl border border-white/10 p-5 [html[data-theme='light']_&]:border-zinc-200">
              <Sparkles className="h-8 w-8 text-reels-cyan" strokeWidth={1.5} aria-hidden />
              <p className="mt-3 text-[15px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                빠른 결제
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                잔액에서 즉시 차감되어, 창작 흐름이 끊기지 않습니다.
              </p>
            </li>
            <li className="reels-glass-card rounded-2xl border border-white/10 p-5 [html[data-theme='light']_&]:border-zinc-200">
              <Coins className="h-8 w-8 text-amber-300/90" strokeWidth={1.5} aria-hidden />
              <p className="mt-3 text-[15px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                보너스 혜택
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                충전 구간에 따라 추가 크레딧이 제공될 수 있습니다. (정책별 상이)
              </p>
            </li>
            <li className="reels-glass-card rounded-2xl border border-white/10 p-5 [html[data-theme='light']_&]:border-zinc-200">
              <Shield className="h-8 w-8 text-emerald-400/90" strokeWidth={1.5} aria-hidden />
              <p className="mt-3 text-[15px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                한도·관리
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                사용 계획에 맞춰 금액을 정해 두면 지출 관리가 쉬워집니다.
              </p>
            </li>
          </ul>
        </section>

        {/* 금액 플랜 */}
        <section className="mt-14 sm:mt-16" aria-labelledby="recharge-tiers">
          <h2
            id="recharge-tiers"
            className="text-xl font-extrabold tracking-tight [html[data-theme='light']_&]:text-zinc-900 sm:text-2xl"
          >
            충전 금액 예시
          </h2>
          <p className="mt-2 text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            아래는 안내용 예시입니다. 실제 결제·보너스 비율은 서비스 오픈 시 확정됩니다.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((t) => (
              <div
                key={t.amount}
                className={`relative flex flex-col rounded-2xl border p-5 transition [html[data-theme='light']_&]:bg-white ${
                  t.popular
                    ? "border-reels-cyan/55 bg-reels-cyan/[0.08] shadow-[0_0_32px_-12px_rgba(0,242,234,0.35)] [html[data-theme='light']_&]:shadow-[0_12px_40px_-20px_rgba(0,242,234,0.25)]"
                    : "border-white/12 bg-white/[0.03] [html[data-theme='light']_&]:border-zinc-200"
                }`}
              >
                {t.popular ? (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border border-reels-cyan/40 bg-reels-cyan/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-reels-cyan">
                    인기
                  </span>
                ) : null}
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                  {t.label}
                </p>
                <p className="mt-2 text-2xl font-black tabular-nums text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                  {t.amount.toLocaleString("ko-KR")}
                  <span className="ml-0.5 text-base font-bold text-zinc-400">원</span>
                </p>
                {t.bonus ? (
                  <p className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-reels-cyan">
                    <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden />
                    {t.bonus}
                  </p>
                ) : (
                  <p className="mt-2 text-[12px] text-zinc-500">기본 충전</p>
                )}
                <button
                  type="button"
                  disabled
                  className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 py-2.5 text-[13px] font-bold text-zinc-400 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100"
                  aria-disabled="true"
                >
                  PG 연동 후 선택 가능
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 절차 */}
        <section className="mt-14 sm:mt-16" aria-labelledby="recharge-steps">
          <h2
            id="recharge-steps"
            className="text-xl font-extrabold tracking-tight [html[data-theme='light']_&]:text-zinc-900 sm:text-2xl"
          >
            이용 절차
          </h2>
          <ol className="mt-8 space-y-6">
            {steps.map((s) => (
              <li
                key={s.n}
                className="flex gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 sm:gap-6 sm:p-6 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50/80"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-reels-cyan/15 font-mono text-[13px] font-black text-reels-cyan"
                  aria-hidden
                >
                  {s.n}
                </span>
                <div>
                  <h3 className="text-[16px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 결제 수단 안내 */}
        <section
          className="mt-12 rounded-2xl border border-dashed border-reels-cyan/30 bg-reels-cyan/[0.06] p-6 sm:p-8 [html[data-theme='light']_&]:border-reels-cyan/35 [html[data-theme='light']_&]:bg-reels-cyan/10"
          aria-labelledby="recharge-pay"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <CreditCard
              className="h-10 w-10 shrink-0 text-reels-cyan [html[data-theme='light']_&]:text-reels-cyan"
              strokeWidth={1.25}
              aria-hidden
            />
            <div>
              <h2 id="recharge-pay" className="text-lg font-extrabold [html[data-theme='light']_&]:text-zinc-900">
                결제 수단
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                신용·체크카드, 간편결제, 가상계좌 등 PG 연동이 완료되면 이 페이지에서 바로 충전할 수 있습니다.
                현재는 <strong className="text-zinc-200 [html[data-theme='light']_&]:text-zinc-800">연동 준비 중</strong>이며,
                오픈 순서는 공지 및 이메일로 안내됩니다.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-14" aria-labelledby="recharge-faq">
          <h2
            id="recharge-faq"
            className="flex items-center gap-2 text-xl font-extrabold tracking-tight [html[data-theme='light']_&]:text-zinc-900 sm:text-2xl"
          >
            <HelpCircle className="h-6 w-6 text-zinc-500" strokeWidth={1.75} aria-hidden />
            자주 묻는 질문
          </h2>
          <dl className="mt-6 space-y-4">
            {faqs.map((item) => (
              <div
                key={item.q}
                className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white"
              >
                <dt className="text-[14px] font-bold text-zinc-200 [html[data-theme='light']_&]:text-zinc-900">
                  {item.q}
                </dt>
                <dd className="mt-2 text-[13px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* CTA */}
        <section className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/50 to-transparent px-6 py-10 text-center [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:from-zinc-100">
          <p className="max-w-md text-[15px] font-medium text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            충전 오픈 알림·제휴·세금계산서 발급 등은 고객센터로 문의해 주세요.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-reels-cyan/50 bg-reels-cyan/15 px-5 py-2.5 text-[14px] font-bold text-reels-cyan transition hover:bg-reels-cyan/25"
            >
              문의하기
              <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
            </Link>
            <Link
              href="/mypage"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-[14px] font-semibold text-zinc-300 transition hover:border-white/25 hover:text-white [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:border-zinc-400"
            >
              마이페이지
            </Link>
          </div>
          <Link href="/" className="text-[13px] font-semibold text-zinc-500 hover:text-reels-cyan [html[data-theme='light']_&]:text-zinc-600">
            홈으로 돌아가기
          </Link>
        </section>
      </main>
    </div>
  );
}

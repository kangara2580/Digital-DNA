"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Loader2, Lock, Shield } from "lucide-react";
import {
  SUBSCRIPTION_CHECKOUT_PLANS,
  parsePlanKey,
  type SubscriptionPlanKey,
} from "@/data/subscriptionCheckout";
import { addDnaCredits } from "@/lib/dnaCreditsStorage";
import { writeStoredSubscription } from "@/lib/subscriptionStorage";

type Step = "payment" | "summary" | "processing" | "success";

function formatCardNumber(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function addOneMonthIso(from: Date): string {
  const d = new Date(from.getTime());
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

export function SubscribeCheckoutFlow() {
  const params = useSearchParams();
  const mode = params.get("mode");
  const isRegisterCardOnly = mode === "register-card";

  const planFromUrl = parsePlanKey(params.get("plan"));
  const [planKey, setPlanKey] = useState<SubscriptionPlanKey>(
    planFromUrl ?? "creator",
  );

  useEffect(() => {
    if (planFromUrl) setPlanKey(planFromUrl);
  }, [planFromUrl]);

  const plan = SUBSCRIPTION_CHECKOUT_PLANS[planKey];

  const [step, setStep] = useState<Step>("payment");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [holderName, setHolderName] = useState("");
  const [saveDefault, setSaveDefault] = useState(true);

  const maskedLast4 = useMemo(() => {
    const d = cardNumber.replace(/\D/g, "");
    if (d.length < 4) return "••••";
    return d.slice(-4);
  }, [cardNumber]);

  const goNextFromPayment = useCallback(() => {
    setStep("summary");
  }, []);

  const runProcessingThenSuccess = useCallback(() => {
    setStep("processing");
    window.setTimeout(() => {
      if (!isRegisterCardOnly) {
        addDnaCredits(plan.dnaCreditsPerMonth);
        writeStoredSubscription({
          planKey: plan.key,
          planLabel: plan.displayName,
          nextRenewalIso: addOneMonthIso(new Date()),
          updatedAtIso: new Date().toISOString(),
        });
      }
      setStep("success");
    }, 2200);
  }, [isRegisterCardOnly, plan]);

  const onConfirmPay = useCallback(() => {
    runProcessingThenSuccess();
  }, [runProcessingThenSuccess]);

  if (isRegisterCardOnly && step === "success") {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-reels-cyan/20 text-reels-cyan">
          <CheckCircle2 className="h-8 w-8" aria-hidden />
        </div>
        <h1 className="mt-6 text-2xl font-black tracking-tight [html[data-theme='light']_&]:text-zinc-900">
          결제 수단이 등록되었습니다
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
          이후 영상 구매 시 입력 없이 결제할 수 있습니다.
        </p>
        <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:mx-auto sm:flex-row sm:gap-3">
          <Link
            href="/mypage"
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[14px] font-bold text-zinc-100 transition hover:bg-white/10 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
          >
            마이페이지
          </Link>
          <Link
            href="/explore"
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-2xl bg-reels-cyan px-4 py-3 text-[14px] font-bold text-reels-void shadow-[0_0_20px_-10px_rgba(0,242,234,0.5)] transition hover:brightness-110"
          >
            영상 둘러보기
          </Link>
        </div>
      </div>
    );
  }

  if (!isRegisterCardOnly && step === "success") {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-reels-cyan/20 text-reels-cyan">
          <CheckCircle2 className="h-8 w-8" aria-hidden />
        </div>
        <h1 className="mt-6 text-2xl font-black tracking-tight [html[data-theme='light']_&]:text-zinc-900">
          이제 Digital DNA의 모든 기능을 사용할 수 있습니다
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
          결제 완료 즉시 {plan.dnaCreditsPerMonth} DNA 크레딧이 충전되었습니다.
        </p>
        <p className="mt-2 text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          영수증은 가입 시 입력한 이메일로 자동 발송됩니다.
        </p>
        <Link
          href="/create?videoId=1"
          className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-reels-cyan px-5 py-3.5 text-[15px] font-extrabold text-reels-void shadow-[0_0_30px_-10px_rgba(0,242,234,0.55)] sm:w-auto"
        >
          지금 바로 첫 영상의 얼굴을 바꿔보세요
        </Link>
        <p className="mt-6">
          <Link
            href="/mypage"
            className="text-[14px] font-semibold text-reels-cyan hover:underline"
          >
            마이페이지에서 구독·크레딧 확인
          </Link>
        </p>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
        <Loader2
          className="h-10 w-10 animate-spin text-reels-cyan"
          aria-hidden
        />
        <p className="mt-6 text-lg font-bold [html[data-theme='light']_&]:text-zinc-900">
          결제를 안전하게 처리 중입니다…
        </p>
        <p className="mt-2 text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          창을 닫거나 새로고침하지 마세요.
        </p>
      </div>
    );
  }

  if (step === "summary") {
    if (isRegisterCardOnly) {
      return (
        <div className="mx-auto max-w-lg px-4 py-10">
          <h1 className="text-xl font-black [html[data-theme='light']_&]:text-zinc-900">
            카드 등록 확인
          </h1>
          <p className="mt-2 text-[14px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            아래 카드가 기본 결제 수단으로 저장됩니다. 구독 결제는 별도로 진행할 수 있습니다.
          </p>
          <div className="mt-6 rounded-2xl border border-white/12 bg-black/30 p-6 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
            <p className="text-[12px] font-bold text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              카드
            </p>
            <p className="mt-1 font-mono text-[16px] font-extrabold">
              •••• •••• •••• {maskedLast4}
            </p>
            <p className="mt-4 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              카드 소유자 {holderName || "—"}
            </p>
          </div>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <button
              type="button"
              onClick={onConfirmPay}
              className="order-1 inline-flex w-48 shrink-0 items-center justify-center rounded-2xl bg-reels-cyan py-3 text-[15px] font-extrabold text-reels-void shadow-[0_0_22px_-14px_rgba(0,242,234,0.45)] sm:order-2"
            >
              등록 완료
            </button>
            <button
              type="button"
              onClick={() => setStep("payment")}
              className="order-2 inline-flex w-24 shrink-0 items-center justify-center rounded-xl border border-white/15 py-3 text-[13px] font-semibold text-zinc-300 transition hover:bg-white/5 sm:order-1 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:text-zinc-700"
            >
              수정
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-xl font-black [html[data-theme='light']_&]:text-zinc-900">
          결제 내용 확인
        </h1>
        <p className="mt-2 text-[14px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
          선택한 플랜과 결제 금액을 확인한 뒤 진행해 주세요.
        </p>

        <div className="mt-6 rounded-2xl border border-white/12 bg-black/30 p-6 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
          <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-reels-cyan/90">
            구독
          </p>
          <p className="mt-2 text-[18px] font-extrabold [html[data-theme='light']_&]:text-zinc-900">
            {plan.displayName}
          </p>
          <p className="mt-2 text-2xl font-black text-reels-cyan">
            ${plan.priceUsd}{" "}
            <span className="text-[14px] font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
              / 월
            </span>
          </p>
          <p className="mt-4 text-[13px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
            오늘 ${plan.priceUsd}가 결제되며, 이후 매달 같은 날짜에 자동으로 갱신됩니다.
          </p>
          <div className="mt-4 rounded-xl border border-reels-cyan/25 bg-reels-cyan/10 px-3 py-2 text-[13px] font-semibold text-reels-cyan">
            결제 완료 즉시 {plan.dnaCreditsPerMonth} DNA 크레딧이 충전됩니다.
          </div>
          <p className="mt-4 font-mono text-[12px] text-zinc-500">
            결제 카드 · {maskedLast4}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
          <button
            type="button"
            onClick={onConfirmPay}
            className="order-1 w-full rounded-2xl bg-reels-cyan py-3 text-[15px] font-extrabold text-reels-void shadow-[0_0_22px_-14px_rgba(0,242,234,0.45)] sm:order-2 sm:flex-1"
          >
            ${plan.priceUsd} 결제하기
          </button>
          <button
            type="button"
            onClick={() => setStep("payment")}
            className="order-2 shrink-0 self-center rounded-xl border border-white/15 px-6 py-2.5 text-[13px] font-semibold text-zinc-300 transition hover:bg-white/5 sm:order-1 sm:self-auto sm:py-3 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:text-zinc-700"
          >
            이전
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-10 pt-2 sm:px-0">
      <h1 className="text-xl font-black [html[data-theme='light']_&]:text-zinc-900">
        {isRegisterCardOnly ? "결제 수단 등록" : "결제 수단"}
      </h1>
      <p className="mt-2 text-[14px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
        {isRegisterCardOnly
          ? "등록한 카드는 결제 시 빠르게 사용할 수 있습니다."
          : "구독 결제에 사용할 카드 정보를 입력합니다."}
      </p>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-reels-cyan/25 bg-reels-cyan/10 px-4 py-3">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-reels-cyan" aria-hidden />
        <div>
          <p className="text-[13px] font-semibold leading-snug text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            모든 결제 정보는 Stripe를 통해 암호화되어 안전하게 보호됩니다.
          </p>
          <div className="mt-3 flex items-center gap-2 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            <span>안전한 결제 처리</span>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <label className="block">
          <span className="text-[12px] font-bold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            카드 번호
          </span>
          <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-white/12 bg-black/25 px-3 py-2.5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
            <CreditCard className="h-4 w-4 text-zinc-500" aria-hidden />
            <input
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              className="w-full bg-transparent text-[15px] font-medium outline-none placeholder:text-zinc-600"
            />
          </div>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-[12px] font-bold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
              만료일 (MM/YY)
            </span>
            <input
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => {
                let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                if (v.length >= 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                setExpiry(v);
              }}
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-black/25 px-3 py-2.5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white"
            />
          </label>
          <label className="block">
            <span className="text-[12px] font-bold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
              CVC
            </span>
            <input
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="123"
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-black/25 px-3 py-2.5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-[12px] font-bold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            카드 소유자 이름
          </span>
          <input
            autoComplete="cc-name"
            placeholder="HONG GIL DONG"
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/12 bg-black/25 px-3 py-2.5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white"
          />
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
          <input
            type="checkbox"
            checked={saveDefault}
            onChange={(e) => setSaveDefault(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-white/30 text-reels-cyan focus:ring-reels-cyan"
          />
          <span className="text-[13px] leading-snug text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
            이 카드를 기본 결제 수단으로 저장
          </span>
        </label>
      </div>

      <button
        type="button"
        onClick={goNextFromPayment}
        className="mt-8 w-full rounded-2xl bg-reels-cyan py-3.5 text-[15px] font-extrabold text-reels-void shadow-[0_0_28px_-12px_rgba(0,242,234,0.55)]"
      >
        다음
      </button>

    </div>
  );
}

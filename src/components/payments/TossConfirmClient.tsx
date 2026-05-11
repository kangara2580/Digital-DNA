"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ConfirmState =
  | { status: "confirming" }
  | { status: "success"; productType: string; targetId: string | null }
  | { status: "failed"; message: string };

export function TossConfirmClient({
  paymentKey,
  orderId,
  amount,
}: {
  paymentKey: string | null;
  orderId: string | null;
  amount: string | null;
}) {
  const [state, setState] = useState<ConfirmState>({ status: "confirming" });

  const payload = useMemo(() => {
    if (!paymentKey || !orderId || !amount) return null;
    return { paymentKey, orderId, amount: Number(amount) };
  }, [amount, orderId, paymentKey]);

  useEffect(() => {
    if (!payload || !Number.isFinite(payload.amount)) {
      setState({ status: "failed", message: "결제 승인 정보가 올바르지 않습니다." });
      return;
    }

    let cancelled = false;
    async function confirm() {
      try {
        const response = await fetch("/api/payments/toss/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await response.json().catch(() => null)) as {
          ok?: boolean;
          productType?: string;
          targetId?: string | null;
          message?: string;
          error?: string;
        } | null;

        if (cancelled) return;
        if (!response.ok || !data?.ok) {
          throw new Error(data?.message ?? data?.error ?? "결제 승인에 실패했습니다.");
        }

        setState({
          status: "success",
          productType: data.productType ?? "unknown",
          targetId: data.targetId ?? null,
        });
      } catch (error) {
        if (cancelled) return;
        setState({
          status: "failed",
          message: error instanceof Error ? error.message : "결제 승인에 실패했습니다.",
        });
      }
    }

    void confirm();
    return () => {
      cancelled = true;
    };
  }, [payload]);

  if (state.status === "confirming") {
    return (
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.05] p-8 text-center">
        <p className="text-sm font-bold text-[#ff7abf]">Toss Payments</p>
        <h1 className="mt-3 text-3xl font-black">결제 승인 중입니다</h1>
        <p className="mt-3 text-sm text-zinc-400">
          결제 정보를 서버에서 한 번 더 검증하고 있습니다.
        </p>
      </section>
    );
  }

  if (state.status === "failed") {
    return (
      <section className="w-full max-w-md rounded-lg border border-rose-400/30 bg-rose-400/10 p-8 text-center">
        <p className="text-sm font-bold text-rose-200">결제 승인 실패</p>
        <h1 className="mt-3 text-3xl font-black">처리가 완료되지 않았습니다</h1>
        <p className="mt-3 text-sm leading-6 text-rose-100">{state.message}</p>
        <Link
          href="/credits"
          className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950"
        >
          다시 시도하기
        </Link>
      </section>
    );
  }

  const href =
    state.productType === "video" && state.targetId
      ? `/video/${state.targetId}`
      : state.productType === "credits"
        ? "/credits"
        : "/billing";

  return (
    <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.05] p-8 text-center">
      <p className="text-sm font-bold text-[#ff7abf]">결제 완료</p>
      <h1 className="mt-3 text-3xl font-black">정상적으로 처리됐습니다</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-300">
        구매 권한, 크레딧, 판매자 수익, 관리자 장부가 자동으로 반영됐습니다.
      </p>
      <div className="mt-6 grid gap-3">
        <Link
          href={href}
          className="rounded-full bg-[#ff2f93] px-5 py-3 text-sm font-black text-white"
        >
          확인하러 가기
        </Link>
        <Link href="/billing" className="text-sm font-bold text-zinc-400 hover:text-white">
          결제 내역 보기
        </Link>
      </div>
    </section>
  );
}

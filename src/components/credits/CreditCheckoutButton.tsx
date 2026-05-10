"use client";

import { useState } from "react";

export function CreditCheckoutButton({
  productKey,
  disabled,
}: {
  productKey: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/polar/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType: "credits", productKey }),
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        checkoutUrl?: string;
        loginUrl?: string;
        error?: string;
      } | null;

      if (response.status === 401) {
        window.location.href = payload?.loginUrl ?? "/login";
        return;
      }

      if (!response.ok || !payload?.checkoutUrl) {
        throw new Error(payload?.error ?? "checkout_failed");
      }

      window.location.href = payload.checkoutUrl;
    } catch (checkoutError) {
      console.error("[credits] checkout failed", checkoutError);
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "결제창을 열지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={startCheckout}
        className="h-11 w-full rounded-full bg-[#ff2f93] px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(255,47,147,0.28)] transition hover:bg-[#ff4ba3] disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 disabled:shadow-none"
      >
        {loading ? "결제창 여는 중" : disabled ? "상품 설정 필요" : "Polar로 결제하기"}
      </button>
      {error ? <p className="text-xs font-bold text-rose-300">{error}</p> : null}
    </div>
  );
}

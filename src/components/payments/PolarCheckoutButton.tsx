"use client";

import { useState } from "react";

type PolarCheckoutResponse = {
  ok?: boolean;
  checkoutUrl?: string;
  paymentId?: string;
  error?: string;
  message?: string;
};

export function PolarCheckoutButton({
  packKey,
  children,
  className,
  disabled = false,
  onUnauthorized,
}: {
  packKey: "starter" | "creator" | "studio";
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onUnauthorized?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    if (disabled || loading) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/payments/polar/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packKey }),
      });
      const payload = (await response.json().catch(() => null)) as PolarCheckoutResponse | null;

      if (response.status === 401) {
        if (onUnauthorized) {
          onUnauthorized();
          return;
        }
        window.location.href = "/login";
        return;
      }

      if (!response.ok || !payload?.checkoutUrl) {
        setError(payload?.message ?? payload?.error ?? "결제 세션 생성에 실패했습니다.");
        return;
      }

      // Redirect to Polar checkout page
      window.location.href = payload.checkoutUrl;
    } catch (err) {
      console.warn("[polar.checkout] client failed", err);
      setError("결제 연결에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={loading || disabled}
        onClick={startCheckout}
        className={
          className ??
          "h-11 w-full rounded-full bg-[#ff2f93] px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(255,47,147,0.28)] transition hover:bg-[#ff4ba3] disabled:cursor-wait disabled:bg-zinc-700"
        }
      >
        {loading ? "결제 준비 중..." : children}
      </button>
      {error ? <p className="text-xs font-bold text-rose-300">{error}</p> : null}
    </div>
  );
}

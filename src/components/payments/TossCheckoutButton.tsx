"use client";

import { useState } from "react";

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      requestPayment: (
        method: string,
        params: {
          amount: number;
          orderId: string;
          orderName: string;
          customerName?: string;
          customerEmail?: string;
          successUrl: string;
          failUrl: string;
        },
      ) => Promise<void>;
    };
  }
}

type CheckoutResponse = {
  ok?: boolean;
  clientKey?: string;
  orderId?: string;
  orderName?: string;
  amount?: number;
  customerEmail?: string | null;
  customerName?: string | null;
  successUrl?: string;
  failUrl?: string;
  loginUrl?: string;
  error?: string;
};

function loadTossSdk(): Promise<void> {
  if (window.TossPayments) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://js.tosspayments.com/v1/payment"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Toss SDK load failed")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v1/payment";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Toss SDK load failed"));
    document.head.appendChild(script);
  });
}

export function TossCheckoutButton({
  productType,
  productKey,
  videoId,
  children,
  className,
}: {
  productType: "credits" | "video";
  productKey?: string;
  videoId?: string;
  children: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startPayment() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/payments/toss/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType, productKey, videoId }),
      });
      const payload = (await response.json().catch(() => null)) as CheckoutResponse | null;

      if (response.status === 401) {
        window.location.href = payload?.loginUrl ?? "/login";
        return;
      }

      if (
        !response.ok ||
        !payload?.clientKey ||
        !payload.orderId ||
        !payload.orderName ||
        !payload.amount ||
        !payload.successUrl ||
        !payload.failUrl
      ) {
        throw new Error(payload?.error ?? "checkout_failed");
      }

      await loadTossSdk();
      if (!window.TossPayments) throw new Error("Toss SDK is unavailable.");

      await window.TossPayments(payload.clientKey).requestPayment("카드", {
        amount: payload.amount,
        orderId: payload.orderId,
        orderName: payload.orderName,
        customerName: payload.customerName ?? undefined,
        customerEmail: payload.customerEmail ?? undefined,
        successUrl: payload.successUrl,
        failUrl: payload.failUrl,
      });
    } catch (paymentError) {
      console.error("[toss.checkout] client failed", paymentError);
      setError(
        paymentError instanceof Error
          ? paymentError.message
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
        disabled={loading}
        onClick={startPayment}
        className={
          className ??
          "h-11 w-full rounded-full bg-[#ff2f93] px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(255,47,147,0.28)] transition hover:bg-[#ff4ba3] disabled:cursor-wait disabled:bg-zinc-700"
        }
      >
        {loading ? "토스 결제창 여는 중" : children}
      </button>
      {error ? <p className="text-xs font-bold text-rose-300">{error}</p> : null}
    </div>
  );
}

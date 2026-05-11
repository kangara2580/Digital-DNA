"use client";

import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";

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
  disabled = false,
  /** 401일 때 로그인 페이지로 보내지 않고 모달 등을 띄울 때 사용 */
  onUnauthorized,
}: {
  productType: "credits" | "video";
  productKey?: string;
  videoId?: string;
  children: string;
  className?: string;
  disabled?: boolean;
  onUnauthorized?: () => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function checkoutMessageForError(code: string | undefined): string {
    if (code === "toss_not_configured") return t("checkout.error.tossNotConfigured");
    return t("checkout.error.generic");
  }

  async function startPayment() {
    if (disabled || loading) return;

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
        if (onUnauthorized) {
          onUnauthorized();
          return;
        }
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
        setError(checkoutMessageForError(payload?.error));
        return;
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
      console.warn("[toss.checkout] client failed", paymentError);
      setError(t("checkout.error.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={loading || disabled}
        onClick={startPayment}
        className={
          className ??
          "h-11 w-full rounded-full bg-[#ff2f93] px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(255,47,147,0.28)] transition hover:bg-[#ff4ba3] disabled:cursor-wait disabled:bg-zinc-700"
        }
      >
        {loading ? t("assets.checkoutBusy") : children}
      </button>
      {error ? <p className="text-xs font-bold text-rose-300">{error}</p> : null}
    </div>
  );
}

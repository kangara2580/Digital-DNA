"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { toGemPrice, formatGems } from "@/lib/gemPrice";

type PurchaseResult = {
  ok?: boolean;
  error?: string;
  required?: number;
  balance?: number;
  purchaseId?: string;
  gemPrice?: number;
};

export function CreditPurchaseButton({
  videoId,
  priceWon,
  onUnauthorized,
  onInsufficientCredits,
  children,
  className,
  disabled = false,
}: {
  videoId: string;
  priceWon: number;
  onUnauthorized?: () => void;
  onInsufficientCredits?: (required: number, balance: number) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gemPrice = toGemPrice(priceWon);

  const handlePurchase = useCallback(async () => {
    if (disabled || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/videos/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });

      const data = (await res.json().catch(() => null)) as PurchaseResult | null;

      if (res.status === 401) {
        if (onUnauthorized) {
          onUnauthorized();
          return;
        }
        router.push("/login");
        return;
      }

      if (res.status === 402 || data?.error === "insufficient_credits") {
        const required = data?.required ?? gemPrice;
        const balance = data?.balance ?? 0;
        if (onInsufficientCredits) {
          onInsufficientCredits(required, balance);
        } else {
          setError(
            t("gems.insufficient.inline", {
              required: formatGems(required),
            }),
          );
        }
        return;
      }

      if (res.status === 409) {
        router.push(`/create?videoId=${encodeURIComponent(videoId)}`);
        return;
      }

      if (!res.ok || !data?.ok) {
        const msg =
          data?.error === "cannot_buy_own_video"
            ? t("gems.purchase.errOwnVideo")
            : data?.error === "video_not_found"
              ? t("gems.purchase.errNotFound")
              : t("gems.purchase.errGeneric");
        setError(msg);
        return;
      }

      router.push(`/create?videoId=${encodeURIComponent(videoId)}`);
      router.refresh();
    } catch {
      setError(t("gems.purchase.errNetwork"));
    } finally {
      setLoading(false);
    }
  }, [
    videoId,
    gemPrice,
    disabled,
    loading,
    onUnauthorized,
    onInsufficientCredits,
    router,
    t,
  ]);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={loading || disabled}
        onClick={handlePurchase}
        className={
          className ??
          "h-11 w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-black text-white"
        }
      >
        {loading ? `${t("gems.purchase.busy")}...` : children}
      </button>
      {error ? (
        <p className="text-center text-xs font-medium text-rose-400 [html[data-theme='light']_&]:text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

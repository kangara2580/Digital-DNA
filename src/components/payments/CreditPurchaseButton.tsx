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
        if (onInsufficientCredits) {
          onInsufficientCredits(
            data?.required ?? gemPrice,
            data?.balance ?? 0,
          );
        } else {
          setError(`보석이 부족합니다. 필요: ${formatGems(data?.required ?? gemPrice)}`);
        }
        return;
      }

      if (res.status === 409) {
        // Already purchased — redirect to studio
        router.push(`/create?videoId=${encodeURIComponent(videoId)}`);
        return;
      }

      if (!res.ok || !data?.ok) {
        const msg = data?.error === "cannot_buy_own_video"
          ? "자신의 영상은 구매할 수 없습니다."
          : data?.error === "video_not_found"
            ? "영상을 찾을 수 없습니다."
            : "구매 처리 중 오류가 발생했습니다.";
        setError(msg);
        return;
      }

      // Purchase successful — redirect to studio
      router.push(`/create?videoId=${encodeURIComponent(videoId)}`);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [videoId, gemPrice, disabled, loading, onUnauthorized, onInsufficientCredits, router]);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={loading || disabled}
        onClick={handlePurchase}
        className={
          className ??
          "h-11 w-full rounded-full bg-[#ff2f93] px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(255,47,147,0.28)] transition hover:bg-[#ff4ba3] disabled:cursor-wait disabled:bg-zinc-700"
        }
      >
        {loading ? "처리 중..." : children}
      </button>
      {error ? <p className="text-center text-xs font-bold text-rose-300">{error}</p> : null}
    </div>
  );
}

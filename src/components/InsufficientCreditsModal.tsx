"use client";

import { useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { formatGems } from "@/lib/gemPrice";
import { useTranslation } from "@/hooks/useTranslation";

export function InsufficientCreditsModal({
  required,
  balance,
  onClose,
}: {
  required: number;
  balance: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const titleId = useId();
  const shortage = Math.max(0, required - balance);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[999] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-[min(100%,24rem)] rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-2xl sm:p-6 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id={titleId}
          className="text-lg font-black text-white sm:text-xl [html[data-theme='light']_&]:text-zinc-900"
        >
          {t("gems.insufficient.title")}
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-500">
          {t("gems.insufficient.lead")}
        </p>

        <dl className="mt-4 space-y-2.5 text-sm text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
          <div className="flex items-center justify-between gap-3">
            <dt>{t("gems.insufficient.required")}</dt>
            <dd className="font-black tabular-nums text-white [html[data-theme='light']_&]:text-zinc-900">
              {formatGems(required)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt>{t("gems.insufficient.balance")}</dt>
            <dd className="font-black tabular-nums text-amber-400 [html[data-theme='light']_&]:text-amber-600">
              {formatGems(balance)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-2.5 [html[data-theme='light']_&]:border-zinc-200">
            <dt>{t("gems.insufficient.shortage")}</dt>
            <dd className="font-black tabular-nums text-rose-400 [html[data-theme='light']_&]:text-rose-600">
              {formatGems(shortage)}
            </dd>
          </div>
        </dl>

        <div className="mt-6 grid gap-2 sm:grid-cols-1">
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push("/credits");
            }}
            className="h-11 w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-black text-white shadow-lg transition hover:shadow-amber-500/30 active:scale-[0.98] motion-reduce:active:scale-100"
          >
            {t("gems.insufficient.chargeCta")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-full rounded-full border border-white/20 text-sm font-bold text-zinc-400 transition hover:bg-white/5 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:bg-zinc-50"
          >
            {t("gems.insufficient.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { localizeApiError } from "@/lib/i18n/localizeApiError";
import { parseSafePaymentNextParam, videoIdFromPurchaseCompletePath } from "@/lib/safePaymentNextPath";
import type { SiteLocale } from "@/lib/sitePreferences";

type ConfirmState =
  | { status: "confirming" }
  | { status: "success"; productType: string; targetId: string | null }
  | { status: "failed"; message: string };

export function TossConfirmClient({
  paymentKey,
  orderId,
  amount,
  nextRedirect,
}: {
  paymentKey: string | null;
  orderId: string | null;
  amount: string | null;
  nextRedirect?: string | null;
}) {
  const { t, locale } = useTranslation();
  const loc = locale as SiteLocale;
  const [state, setState] = useState<ConfirmState>({ status: "confirming" });

  const payload = useMemo(() => {
    if (!paymentKey || !orderId || !amount) return null;
    return { paymentKey, orderId, amount: Number(amount) };
  }, [amount, orderId, paymentKey]);

  useEffect(() => {
    if (!payload || !Number.isFinite(payload.amount)) {
      setState({ status: "failed", message: t("toss.confirm.invalidPayload") });
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
          throw new Error(
            localizeApiError(loc, data?.message ?? data?.error) || t("toss.confirm.fail"),
          );
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
          message:
            error instanceof Error
              ? localizeApiError(loc, error.message)
              : t("toss.confirm.fail"),
        });
      }
    }

    void confirm();
    return () => {
      cancelled = true;
    };
  }, [payload, loc, t]);

  if (state.status === "confirming") {
    return (
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.05] p-8 text-center">
        <p className="text-sm font-bold text-[#ff7abf]">Toss Payments</p>
        <h1 className="mt-3 text-3xl font-black">{t("toss.confirming.title")}</h1>
        <p className="mt-3 text-sm text-zinc-400">{t("toss.confirming.lead")}</p>
      </section>
    );
  }

  if (state.status === "failed") {
    return (
      <section className="w-full max-w-md rounded-lg border border-rose-400/30 bg-rose-400/10 p-8 text-center">
        <p className="text-sm font-bold text-rose-200">{t("toss.failed.label")}</p>
        <h1 className="mt-3 text-3xl font-black">{t("toss.failed.title")}</h1>
        <p className="mt-3 text-sm leading-6 text-rose-100">{state.message}</p>
        <Link
          href="/assets"
          className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950"
        >
          {t("toss.retry")}
        </Link>
      </section>
    );
  }

  const safeNext = nextRedirect ? parseSafePaymentNextParam(nextRedirect) : null;
  const nextVideoId = safeNext ? videoIdFromPurchaseCompletePath(safeNext) : null;
  const nextMatchesTarget =
    Boolean(safeNext && state.targetId && nextVideoId) && nextVideoId === state.targetId;
  const href =
    nextMatchesTarget && state.productType === "video"
      ? safeNext!
      : state.productType === "video" && state.targetId
        ? `/video/${state.targetId}`
        : "/assets";

  return (
    <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.05] p-8 text-center">
      <p className="text-sm font-bold text-[#ff7abf]">{t("toss.done.label")}</p>
      <h1 className="mt-3 text-3xl font-black">{t("toss.done.title")}</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-300">{t("toss.done.lead")}</p>
      <div className="mt-6 grid gap-3">
        <Link
          href={href}
          className="rounded-full bg-[#ff2f93] px-5 py-3 text-sm font-black text-white"
        >
          {t("toss.done.cta")}
        </Link>
        <Link href="/assets" className="text-sm font-bold text-zinc-400 hover:text-white">
          {t("toss.done.assets")}
        </Link>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Film, Sparkles } from "lucide-react";
import { usePurchasedVideos } from "@/context/PurchasedVideosContext";
import { useSitePreferences } from "@/context/SitePreferencesContext";
import { ALL_MARKET_VIDEOS } from "@/data/videoCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { readStoredSubscription } from "@/lib/subscriptionStorage";
import type { SiteLocale } from "@/lib/sitePreferences";

function formatNextRenewal(iso: string, locale: SiteLocale): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return "—";
  }
}

export function MyPageAccountOverview() {
  const { hasPurchased } = usePurchasedVideos();
  const { t } = useTranslation();
  const { locale } = useSitePreferences();
  const loc = locale as SiteLocale;
  const [sub, setSub] = useState(() => readStoredSubscription());

  useEffect(() => {
    const sync = () => {
      setSub(readStoredSubscription());
    };
    sync();
    window.addEventListener("reels-subscription-updated", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("reels-subscription-updated", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const purchasedVideos = useMemo(() => {
    return ALL_MARKET_VIDEOS.filter((v) => hasPurchased(v.id));
  }, [hasPurchased]);

  return (
    <div className="mb-3 grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-zinc-500 [html[data-theme='light']_&]:text-zinc-400" aria-hidden />
          <h3 className="text-[15px] font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            {t("accountOverview.subscription")}
          </h3>
        </div>
        {sub ? (
          <>
            <p className="mt-2 text-[17px] font-semibold text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
              {sub.planLabel}
            </p>
            <p className="mt-1 text-[14px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-500">
              {t("accountOverview.nextRenewal", { date: formatNextRenewal(sub.nextRenewalIso, loc) })}
            </p>
          </>
        ) : (
          <p className="mt-2 text-[15px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            {t("accountOverview.noSubscription")}
          </p>
        )}
        <Link
          href="/subscribe"
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-center text-[15px] font-semibold text-zinc-100 transition hover:border-[#E42980] hover:text-[#F07AB0] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:text-[#E42980]"
        >
          {sub ? t("accountOverview.managePlan") : t("accountOverview.startSub")}
        </Link>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-zinc-500 [html[data-theme='light']_&]:text-zinc-400" aria-hidden />
          <h3 className="text-[15px] font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            {t("accountOverview.purchasedVideos")}
          </h3>
        </div>
        {purchasedVideos.length === 0 ? (
          <p className="mt-2 text-[15px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            {t("accountOverview.noPurchases")}
          </p>
        ) : (
          <ul className="mt-2 max-h-28 space-y-1.5 overflow-y-auto pr-1 text-[15px]">
            {purchasedVideos.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/video/${v.id}`}
                  className="font-medium text-zinc-200 transition hover:text-[#F07AB0] [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:text-[#E42980]"
                >
                  {v.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/explore"
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-center text-[15px] font-semibold text-zinc-100 transition hover:border-[#E42980] hover:text-[#F07AB0] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:text-[#E42980]"
        >
          {t("accountOverview.browse")}
        </Link>
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { DocumentTitleI18n } from "@/components/DocumentTitleI18n";
import { PaymentDiamondIcon } from "@/components/PaymentDiamondIcon";
import { MyPageSectionShell } from "@/components/MyPageSectionShell";
import { TossCheckoutButton } from "@/components/payments/TossCheckoutButton";
import { formatCredits } from "@/components/assets/assetsFormat";
import { useMeWallet } from "@/hooks/useMeWallet";
import { useTranslation } from "@/hooks/useTranslation";
import { MYPAGE_OUTLINE_BTN_SM } from "@/lib/mypageOutlineCta";
import type { SiteLocale } from "@/lib/sitePreferences";
import { tossCreditPacks } from "@/lib/tossConfig";

export function AssetsCreditPaymentClient() {
  const { t, locale } = useTranslation();
  const { wallet, walletError, walletLoading, loadWallet } = useMeWallet();
  const tossReady = Boolean(wallet?.toss.hasClientKey && wallet?.toss.hasSecretKey);

  return (
    <>
      <DocumentTitleI18n titleKey="meta.assetsCreditPayment" />

      {walletError ? (
        <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-5 text-sm text-rose-100 [html[data-theme='light']_&]:border-rose-200 [html[data-theme='light']_&]:bg-rose-50 [html[data-theme='light']_&]:text-rose-900">
          <p>{walletError}</p>
          <button type="button" onClick={() => void loadWallet()} className={`mt-4 ${MYPAGE_OUTLINE_BTN_SM}`}>
            {t("assets.reload")}
          </button>
        </div>
      ) : null}

      <div className="space-y-10">
        <div
          id="credit-balance"
          className="scroll-mt-28 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-6 sm:p-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:from-zinc-50 [html[data-theme='light']_&]:to-white"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--reels-point)]/35 bg-[color:var(--reels-point)]/10 text-[color:var(--reels-point)] [html[data-theme='light']_&]:bg-[color:var(--reels-point)]/12">
                <PaymentDiamondIcon className="h-7 w-7" />
              </span>
              <div className="pt-0.5">
                <p className="text-3xl font-semibold leading-none tracking-tight text-zinc-50 sm:text-4xl [html[data-theme='light']_&]:text-zinc-900">
                  {formatCredits(wallet?.balance ?? 0, locale as SiteLocale)}{" "}
                  <span className="text-lg font-medium text-zinc-400 [html[data-theme='light']_&]:text-zinc-500">
                    {t("assets.hero.gemsUnit")}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/billing" className={MYPAGE_OUTLINE_BTN_SM}>
                {t("assets.section.payment.billingLink")}
              </Link>
            </div>
          </div>
          {walletLoading ? <p className="mt-6 text-[15px] text-zinc-500">{t("common.loading")}</p> : null}
        </div>

        <div id="credit-topup" className="scroll-mt-28 space-y-8">
          <MyPageSectionShell
            title={t("assets.section.credits.title")}
            description={t("assets.section.credits.lead")}
          >
            <div className="grid gap-4 md:grid-cols-3">
              {tossCreditPacks.map((pack) => {
                const recommended = pack.key === "creator";
                return (
                  <article
                    key={pack.key}
                    className={
                      recommended
                        ? "rounded-2xl border border-[color:var(--reels-point)]/45 bg-[color:var(--reels-point)]/8 p-5 [html[data-theme='light']_&]:border-[color:var(--reels-point)]/35 [html[data-theme='light']_&]:bg-[color:var(--reels-point)]/10"
                        : "rounded-2xl border border-white/10 bg-white/[0.03] p-5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50/80"
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
                          {pack.name}
                        </p>
                        <p className="mt-1 text-[14px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                          {pack.description}
                        </p>
                      </div>
                      {recommended ? (
                        <span className="rounded-full bg-[color:var(--reels-point)]/90 px-2.5 py-1 text-[11px] font-semibold text-white">
                          {t("assets.pack.recommended")}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-5 text-2xl font-semibold text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
                      {t("assets.pack.creditsLine", { credits: formatCredits(pack.credits, locale as SiteLocale) })}
                    </p>
                    <p className="mt-1 text-[15px] font-medium text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                      {t("assets.pack.priceLine", {
                        price: new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US").format(pack.priceKrw),
                      })}
                    </p>
                    <div className="mt-5">
                      <TossCheckoutButton
                        productType="credits"
                        productKey={pack.key}
                        disabled={!tossReady}
                        className={`${MYPAGE_OUTLINE_BTN_SM} w-full border-[color:var(--reels-point)] text-[15px] disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {t("assets.pack.buy")}
                      </TossCheckoutButton>
                    </div>
                  </article>
                );
              })}
            </div>
          </MyPageSectionShell>
        </div>
      </div>
    </>
  );
}

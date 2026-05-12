"use client";

import { useEffect, useMemo, useState } from "react";
import { DocumentTitleI18n } from "@/components/DocumentTitleI18n";
import { MyPageSectionShell } from "@/components/MyPageSectionShell";
import { formatCredits, formatWhen, formatWon, ledgerTypeLabel } from "@/components/assets/assetsFormat";
import { useMeWallet } from "@/hooks/useMeWallet";
import { useTranslation } from "@/hooks/useTranslation";
import { MYPAGE_OUTLINE_BTN_SM } from "@/lib/mypageOutlineCta";
import type { SiteLocale } from "@/lib/sitePreferences";

export function AssetsSettlementClient() {
  const { t, locale } = useTranslation();
  const { wallet, walletError, walletLoading, loadWallet } = useMeWallet();

  const [regBankName, setRegBankName] = useState("");
  const [regAccountNo, setRegAccountNo] = useState("");
  const [regAccountHolder, setRegAccountHolder] = useState("");
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);

  const [payoutBusy, setPayoutBusy] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet) return;
    setRegBankName(wallet.payoutAccount?.bankName ?? "");
    setRegAccountNo(wallet.payoutAccount?.accountNo ?? "");
    setRegAccountHolder(wallet.payoutAccount?.accountHolder ?? "");
  }, [wallet]);

  const feePct = useMemo(() => {
    const bps = wallet?.policy.platformFeeRateBps ?? 0;
    return (bps / 100).toLocaleString(locale === "ko" ? "ko-KR" : "en-US", {
      maximumFractionDigits: 2,
    });
  }, [locale, wallet?.policy.platformFeeRateBps]);

  const available = wallet?.settlement.availableAmount ?? 0;

  const hasPayoutAccount = Boolean(
    wallet?.payoutAccount?.bankName &&
      wallet.payoutAccount.accountNo &&
      wallet.payoutAccount.accountHolder,
  );

  async function savePayoutAccount() {
    if (accountBusy) return;
    setAccountBusy(true);
    setAccountError(null);
    setAccountMessage(null);
    const bn = regBankName.trim();
    const an = regAccountNo.trim();
    const ah = regAccountHolder.trim();
    if (!bn || !an || !ah) {
      setAccountError(t("assets.payout.accountFieldsRequired"));
      setAccountBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/me/payout-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankName: bn, accountNo: an, accountHolder: ah }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) {
        setAccountError(
          data?.error === "fields_required"
            ? t("assets.payout.accountFieldsRequired")
            : t("assets.payout.accountSaveErr"),
        );
        return;
      }
      setAccountMessage(t("assets.payout.accountSaved"));
      await loadWallet();
    } catch {
      setAccountError(t("assets.payout.accountSaveErr"));
    } finally {
      setAccountBusy(false);
    }
  }

  async function submitPayout() {
    if (!wallet || available <= 0 || payoutBusy) return;
    setPayoutBusy(true);
    setPayoutError(null);
    setPayoutMessage(null);
    try {
      const res = await fetch("/api/me/settlement-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: available,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        availableAmount?: number;
      } | null;

      if (!res.ok || !data?.ok) {
        if (data?.error === "no_available") {
          setPayoutError(t("assets.payout.errNoAvailable"));
        } else if (data?.error === "payout_account_required") {
          setPayoutError(t("assets.payout.errAccountRequired"));
        } else if (data?.error === "full_amount_required" && typeof data.availableAmount === "number") {
          setPayoutError(
            `${t("assets.payout.errFullAmount")} (${t("assets.payout.available")}: ${formatWon(data.availableAmount, locale as SiteLocale)})`,
          );
        } else {
          setPayoutError(t("assets.payout.errAmount"));
        }
        return;
      }

      setPayoutMessage(t("assets.payout.success"));
      await loadWallet();
    } catch {
      setPayoutError(t("assets.errLoad"));
    } finally {
      setPayoutBusy(false);
    }
  }

  return (
    <>
      <DocumentTitleI18n titleKey="meta.assetsSettlement" />

      {walletError ? (
        <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-5 text-sm text-rose-100 [html[data-theme='light']_&]:border-rose-200 [html[data-theme='light']_&]:bg-rose-50 [html[data-theme='light']_&]:text-rose-900">
          <p>{walletError}</p>
          <button type="button" onClick={() => void loadWallet()} className={`mt-4 ${MYPAGE_OUTLINE_BTN_SM}`}>
            {t("assets.reload")}
          </button>
        </div>
      ) : null}

      <div className="space-y-10">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-6 sm:p-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:from-zinc-50 [html[data-theme='light']_&]:to-white">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
            {t("assets.settlement.kpiHeading")}
          </h2>
          {wallet && !walletLoading ? (
            <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  ["assets.payout.available", wallet.settlement.availableAmount],
                  ["assets.payout.pending", wallet.settlement.pendingAmount],
                  ["assets.payout.requested", wallet.settlement.requestedAmount],
                  ["assets.payout.paid", wallet.settlement.paidAmount],
                ] as const
              ).map(([labelKey, value]) => (
                <div
                  key={labelKey}
                  className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50"
                >
                  <dt className="text-[13px] font-medium text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
                    {t(labelKey)}
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
                    {formatWon(value, locale as SiteLocale)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-6 text-[15px] text-zinc-500">{walletLoading ? t("common.loading") : ""}</p>
          )}
        </div>

        <MyPageSectionShell title={t("assets.section.ledger.title")} description={t("assets.section.ledger.lead")}>
          <div className="overflow-hidden rounded-xl border border-white/10 [html[data-theme='light']_&]:border-zinc-200">
            <table className="min-w-full text-left text-[14px]">
              <thead className="border-b border-white/10 bg-white/[0.03] text-zinc-400 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("assets.col.date")}</th>
                  <th className="px-4 py-3 font-medium">{t("assets.col.type")}</th>
                  <th className="px-4 py-3 font-medium">{t("assets.col.detail")}</th>
                  <th className="px-4 py-3 font-medium">{t("assets.col.change")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 [html[data-theme='light']_&]:divide-zinc-100">
                {!wallet || wallet.ledger.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-zinc-500 [html[data-theme='light']_&]:text-zinc-500"
                    >
                      {t("assets.ledger.empty")}
                    </td>
                  </tr>
                ) : (
                  wallet.ledger.map((row) => {
                    const positive = row.type === "purchase" || row.amount >= 0;
                    const changeKey = positive ? "assets.ledger.amountPlus" : "assets.ledger.amountMinus";
                    const absAmt = Math.abs(row.amount);
                    return (
                      <tr key={row.id}>
                        <td className="px-4 py-3 text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
                          {formatWhen(row.createdAt, locale as SiteLocale)}
                        </td>
                        <td className="px-4 py-3 text-zinc-200 [html[data-theme='light']_&]:text-zinc-800">
                          {ledgerTypeLabel(row.type, t)}
                        </td>
                        <td className="px-4 py-3 text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
                          {row.reason}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              positive
                                ? "font-semibold text-emerald-300 [html[data-theme='light']_&]:text-emerald-700"
                                : "font-semibold text-rose-200 [html[data-theme='light']_&]:text-rose-700"
                            }
                          >
                            {t(changeKey, { n: formatCredits(absAmt, locale as SiteLocale) })}
                          </span>
                          <span className="ml-2 text-[13px] text-zinc-500">
                            {t("assets.ledger.balanceAfter", {
                              n: formatCredits(row.balanceAfter, locale as SiteLocale),
                            })}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </MyPageSectionShell>

        <MyPageSectionShell title={t("assets.section.payouts.title")} description={t("assets.section.payouts.lead")}>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
            <h3 className="text-lg font-semibold text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
              {t("assets.payout.accountSectionTitle")}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
              {t("assets.payout.accountSectionLead")}
            </p>
            {accountMessage ? (
              <p className="mt-3 text-[15px] text-emerald-300 [html[data-theme='light']_&]:text-emerald-800">
                {accountMessage}
              </p>
            ) : null}
            {accountError ? (
              <p className="mt-3 text-[15px] text-rose-300 [html[data-theme='light']_&]:text-rose-800">
                {accountError}
              </p>
            ) : null}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-[14px] font-medium text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
                {t("assets.payout.accountBankLabel")}
                <input
                  value={regBankName}
                  onChange={(e) => setRegBankName(e.target.value)}
                  autoComplete="organization"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-[15px] text-zinc-100 outline-none ring-[color:var(--reels-point)]/30 focus:ring-2 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
                />
              </label>
              <label className="block text-[14px] font-medium text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
                {t("assets.payout.accountNumberLabel")}
                <input
                  value={regAccountNo}
                  onChange={(e) => setRegAccountNo(e.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-[15px] text-zinc-100 outline-none ring-[color:var(--reels-point)]/30 focus:ring-2 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
                />
              </label>
              <label className="block text-[14px] font-medium text-zinc-300 sm:col-span-2 [html[data-theme='light']_&]:text-zinc-700">
                {t("assets.payout.accountHolderLabel")}
                <input
                  value={regAccountHolder}
                  onChange={(e) => setRegAccountHolder(e.target.value)}
                  autoComplete="name"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-[15px] text-zinc-100 outline-none ring-[color:var(--reels-point)]/30 focus:ring-2 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
                />
              </label>
            </div>
            <button
              type="button"
              disabled={!wallet || walletLoading || accountBusy}
              onClick={() => void savePayoutAccount()}
              className={`mt-6 ${MYPAGE_OUTLINE_BTN_SM} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {accountBusy ? t("assets.payout.accountSavingBusy") : t("assets.payout.accountSaveCta")}
            </button>
          </div>

          {wallet ? (
            <div className="mt-8 space-y-3 text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
              <p>{t("assets.payout.holdHint", { days: wallet.policy.settlementHoldDays })}</p>
              <p>
                {t("assets.payout.feeHint", {
                  pct: feePct,
                  bps: wallet.policy.platformFeeRateBps,
                })}
              </p>
              <p className="text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                {t("assets.payout.fullWithdrawNote")}
              </p>
            </div>
          ) : null}

          <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
            <h3 className="text-lg font-semibold text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
              {t("assets.payout.requestTitle")}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
              {t("assets.payout.requestSectionLead")}
            </p>
            {payoutMessage ? (
              <p className="mt-3 text-[15px] text-emerald-300 [html[data-theme='light']_&]:text-emerald-800">
                {payoutMessage}
              </p>
            ) : null}
            {payoutError ? (
              <p className="mt-3 text-[15px] text-rose-300 [html[data-theme='light']_&]:text-rose-800">
                {payoutError}
              </p>
            ) : null}

            <div className="mt-5">
              <label className="block text-[14px] font-medium text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
                {t("assets.payout.amountLabel")}
                <input
                  readOnly
                  value={wallet ? formatWon(available, locale as SiteLocale) : ""}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-[15px] text-zinc-100 outline-none [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
                />
              </label>
            </div>

            <button
              type="button"
              disabled={
                !wallet ||
                !hasPayoutAccount ||
                available <= 0 ||
                available < 1000 ||
                payoutBusy ||
                walletLoading
              }
              onClick={() => void submitPayout()}
              className={`mt-6 ${MYPAGE_OUTLINE_BTN_SM} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {payoutBusy ? t("assets.payout.submitBusy") : t("assets.payout.requestFullCta")}
            </button>
          </div>

          <div className="mt-10">
            <h3 className="text-lg font-semibold text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
              {t("assets.payout.requestsTitle")}
            </h3>
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10 [html[data-theme='light']_&]:border-zinc-200">
              <table className="min-w-full text-left text-[14px]">
                <thead className="border-b border-white/10 bg-white/[0.03] text-zinc-400 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t("assets.col.date")}</th>
                    <th className="px-4 py-3 font-medium">{t("assets.payments.amount")}</th>
                    <th className="px-4 py-3 font-medium">{t("assets.payout.statusLabel")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 [html[data-theme='light']_&]:divide-zinc-100">
                  {!wallet || wallet.settlementRequests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-10 text-center text-zinc-500 [html[data-theme='light']_&]:text-zinc-500"
                      >
                        {t("assets.payout.noRequests")}
                      </td>
                    </tr>
                  ) : (
                    wallet.settlementRequests.map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-3 text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
                          {formatWhen(row.createdAt, locale as SiteLocale)}
                        </td>
                        <td className="px-4 py-3 font-medium text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                          {formatWon(row.amount, locale as SiteLocale)}
                        </td>
                        <td className="px-4 py-3 text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
                          {row.status}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </MyPageSectionShell>
      </div>
    </>
  );
}

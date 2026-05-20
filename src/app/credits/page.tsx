import Link from "next/link";
import { CheckCircle2, CreditCard, Sparkles, WalletCards } from "lucide-react";
import { TossCheckoutButton } from "@/components/payments/TossCheckoutButton";
import { getUserCreditSummary } from "@/lib/credits";
import { getCurrentUser } from "@/lib/serverSession";
import { formatPriceWon } from "@/lib/exploreLocaleFormat";
import { translate } from "@/lib/i18n/dictionaries";
import { getSiteLocale } from "@/lib/i18n/serverLocale";
import { getTossEnvStatus, tossCreditPacks } from "@/lib/tossConfig";

export const dynamic = "force-dynamic";

function formatCredits(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export default async function CreditsPage() {
  const locale = await getSiteLocale();
  const user = await getCurrentUser();
  const summary = user ? await getUserCreditSummary(user.id) : null;
  const envStatus = getTossEnvStatus();
  const tossReady = envStatus.hasClientKey && envStatus.hasSecretKey;

  return (
    <main className="min-h-screen bg-[#05050a] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(255,47,147,0.22),transparent_36%),linear-gradient(135deg,#05050a_0%,#0d0f18_58%,#160717_100%)] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="text-sm font-bold text-zinc-400 hover:text-white">
            ARA
          </Link>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#ff7abf]">
                Credits
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
                {translate(locale, "credits.page.lead")}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300">
                {translate(locale, "credits.page.desc")}
              </p>
              {!tossReady ? (
                <p className="mt-4 rounded-md border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-200">
                  {translate(locale, "credits.page.tossMissing")}
                </p>
              ) : null}
            </div>
            <aside className="rounded-lg border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ff2f93]/20 text-[#ff7abf]">
                  <WalletCards size={22} />
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-400">
                    {translate(locale, "credits.page.balance")}
                  </p>
                  <p className="text-3xl font-black">
                    {formatCredits(summary?.balance ?? 0)}
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-md border border-white/10 bg-black/30 p-4 text-sm text-zinc-300">
                {user ? (
                  <>
                    <p className="font-bold text-white">{user.email ?? user.id}</p>
                    <p className="mt-1">{translate(locale, "credits.page.loggedInNote")}</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-white">
                      {translate(locale, "credits.page.loginRequired")}
                    </p>
                    <p className="mt-1">{translate(locale, "credits.page.loginHint")}</p>
                  </>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 py-8 sm:px-8 lg:grid-cols-3">
        {tossCreditPacks.map((pack) => {
          const isRecommended = pack.key === "starter";

          return (
            <article
              key={pack.key}
              className={`rounded-lg border p-5 ${
                isRecommended
                  ? "border-[#ff2f93] bg-[#ff2f93]/10"
                  : "border-white/10 bg-white/[0.04]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black">{pack.name}</p>
                  <p className="mt-1 text-sm text-zinc-400">{pack.description}</p>
                </div>
                {isRecommended ? (
                  <span className="rounded-full bg-[#ff2f93] px-2 py-1 text-xs font-black">
                    {translate(locale, "credits.pack.recommended")}
                  </span>
                ) : null}
              </div>
              <p className="mt-6 text-3xl font-black">{formatCredits(pack.credits)}</p>
              <p className="mt-1 text-sm font-bold text-zinc-400">ARA credits</p>
              <p className="mt-5 text-2xl font-black">
                {formatPriceWon(locale, pack.priceKrw)}
              </p>
              <div className="mt-5 space-y-2 text-sm text-zinc-300">
                <p className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#ff7abf]" />
                  {translate(locale, "credits.pack.tossSupport")}
                </p>
                <p className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#ff7abf]" />
                  {translate(locale, "credits.pack.usageLog")}
                </p>
                <p className="flex items-center gap-2">
                  <CreditCard size={16} className="text-[#ff7abf]" />
                  {translate(locale, "credits.pack.autoCredit")}
                </p>
              </div>
              <div className="mt-6">
                <TossCheckoutButton productType="credits" productKey={pack.key}>
                  {translate(locale, "credits.pack.checkoutCta")}
                </TossCheckoutButton>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

import Link from "next/link";
import { CheckCircle2, CreditCard, Sparkles, WalletCards } from "lucide-react";
import { PolarCheckoutButton } from "@/components/payments/PolarCheckoutButton";
import { getUserCreditSummary } from "@/lib/credits";
import { translate } from "@/lib/i18n/dictionaries";
import { getSiteLocale } from "@/lib/i18n/serverLocale";
import { creditPacks, getPolarEnvStatus } from "@/lib/polarConfig";
import { getCurrentUser } from "@/lib/serverSession";

export const dynamic = "force-dynamic";

function formatCredits(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

export default async function CreditsPage() {
  const locale = await getSiteLocale();
  const user = await getCurrentUser();
  const summary = user ? await getUserCreditSummary(user.id) : null;
  const envStatus = getPolarEnvStatus();
  const polarReady = envStatus.hasAccessToken;

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
                {translate(locale, "assets.section.credits.title")}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300">
                {translate(locale, "assets.section.credits.lead")}
              </p>
              {!polarReady ? (
                <p className="mt-4 rounded-md border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-200">
                  {translate(locale, "credits.page.polarMissing")}
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
        {creditPacks.map((pack) => {
          const isRecommended = pack.key === "creator";

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
              <p className="mt-6 text-3xl font-black">
                {translate(locale, "assets.pack.creditsLine", {
                  credits: formatCredits(pack.credits),
                })}
              </p>
              <p className="mt-2 text-2xl font-black">{formatUsd(pack.priceUsd)}</p>
              <div className="mt-5 space-y-2 text-sm text-zinc-300">
                <p className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#ff7abf]" />
                  {translate(locale, "credits.pack.globalPay")}
                </p>
                <p className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#ff7abf]" />
                  {pack.estimatedUses}
                </p>
                <p className="flex items-center gap-2">
                  <CreditCard size={16} className="text-[#ff7abf]" />
                  {translate(locale, "credits.pack.autoCredit")}
                </p>
              </div>
              <div className="mt-6">
                <PolarCheckoutButton packKey={pack.key} disabled={!polarReady}>
                  {translate(locale, "assets.pack.buy")}
                </PolarCheckoutButton>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

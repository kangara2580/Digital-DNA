import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { translate } from "@/lib/i18n/dictionaries";
import { getSiteLocale } from "@/lib/i18n/serverLocale";

export default async function BillingSuccessPage() {
  const locale = await getSiteLocale();
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05050a] px-5 text-white">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.05] p-8 text-center">
        <CheckCircle2 className="mx-auto text-[#ff2f93]" size={52} />
        <h1 className="mt-5 text-3xl font-black">
          {translate(locale, "billing.success.title")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          {translate(locale, "billing.success.lead")}
        </p>
        <div className="mt-6 grid gap-3">
          <Link
            href="/credits"
            className="rounded-full bg-[#ff2f93] px-5 py-3 text-sm font-black text-white"
          >
            {translate(locale, "billing.success.creditsCta")}
          </Link>
          <Link href="/billing" className="text-sm font-bold text-zinc-400 hover:text-white">
            {translate(locale, "billing.success.historyCta")}
          </Link>
        </div>
      </section>
    </main>
  );
}

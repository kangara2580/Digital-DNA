import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { translate } from "@/lib/i18n/dictionaries";
import { getSiteLocale } from "@/lib/i18n/serverLocale";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AccountSuspendedPage({ searchParams }: PageProps) {
  const locale = await getSiteLocale();
  const params = (await searchParams) ?? {};
  const status = one(params.status) ?? "suspended";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-10 text-slate-950">
      <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-rose-50 text-rose-600">
          <ShieldAlert size={24} />
        </div>
        <h1 className="text-2xl font-black">{translate(locale, "account.suspended.title")}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {translate(locale, "account.suspended.lead", { status })}
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {translate(locale, "account.suspended.contact")}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-bold text-white"
          >
            {translate(locale, "account.suspended.home")}
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-bold text-slate-700"
          >
            {translate(locale, "account.suspended.support")}
          </Link>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import { translate } from "@/lib/i18n/dictionaries";
import { getSiteLocale } from "@/lib/i18n/serverLocale";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function TossFailPage({ searchParams }: PageProps) {
  const locale = await getSiteLocale();
  const params = (await searchParams) ?? {};
  const code = one(params.code);
  const message = one(params.message);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05050a] px-5 text-white">
      <section className="w-full max-w-md rounded-lg border border-rose-400/30 bg-rose-400/10 p-8 text-center">
        <p className="text-sm font-bold text-rose-200">{translate(locale, "toss.fail.label")}</p>
        <h1 className="mt-3 text-3xl font-black">{translate(locale, "toss.fail.title")}</h1>
        <p className="mt-3 text-sm leading-6 text-rose-100">
          {message || translate(locale, "toss.fail.lead")}
        </p>
        {code ? <p className="mt-2 font-mono text-xs text-rose-200">{code}</p> : null}
        <Link
          href="/credits"
          className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950"
        >
          {translate(locale, "toss.fail.retry")}
        </Link>
      </section>
    </main>
  );
}

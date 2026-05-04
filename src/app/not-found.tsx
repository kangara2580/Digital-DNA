import type { Metadata } from "next";
import Link from "next/link";
import { DocumentMetaSync } from "@/components/DocumentMetaSync";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { translate } from "@/lib/i18n/dictionaries";
import { getSiteLocale } from "@/lib/i18n/serverLocale";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    titleKey: "meta.notFound",
    descriptionKey: "meta.notFoundDescription",
  });
}

export default async function NotFound() {
  const locale = await getSiteLocale();
  const suffix = translate(locale, "meta.brandSuffix");
  const tabTitle = translate(locale, "meta.notFound");
  const fullTitle = `${tabTitle}${suffix}`;
  const description = translate(locale, "meta.notFoundDescription");

  return (
    <>
      <DocumentMetaSync title={fullTitle} description={description} />
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col gap-4 px-4 py-16 text-center text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
        <h1 className="text-xl font-extrabold">
          {translate(locale, "meta.notFoundHeading")}
        </h1>
        <p className="text-[14px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
          {translate(locale, "meta.notFoundBody")}
        </p>
        <Link
          href="/"
          className="mx-auto rounded-full bg-reels-crimson px-6 py-2.5 text-[14px] font-bold text-white"
        >
          {translate(locale, "meta.notFoundHome")}
        </Link>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { DocumentMetaSync } from "@/components/DocumentMetaSync";
import { NotFoundPageContent } from "@/components/NotFoundPageContent";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { translate } from "@/lib/i18n/dictionaries";
import { getSiteLocale } from "@/lib/i18n/serverLocale";
import type { SiteLocale } from "@/lib/sitePreferences";

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
      <NotFoundPageContent locale={locale as SiteLocale} />
    </>
  );
}

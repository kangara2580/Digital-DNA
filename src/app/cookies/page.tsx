import { CookiesPolicyBody } from "@/components/CookiesPolicyBody";
import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { translate } from "@/lib/i18n/dictionaries";
import { getSiteLocale } from "@/lib/i18n/serverLocale";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.cookies",
    descriptionKey: "meta.cookiesDescription",
  });
}

export default async function CookiesPage() {
  const locale = await getSiteLocale();
  const title = translate(locale, "meta.cookies");
  return (
    <FooterLegalPageShell title={title} withCard={false} mainMaxClass="max-w-3xl">
      <CookiesPolicyBody />
    </FooterLegalPageShell>
  );
}

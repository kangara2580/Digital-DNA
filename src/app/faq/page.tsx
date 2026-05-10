import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { translate } from "@/lib/i18n/dictionaries";
import { getSiteLocale } from "@/lib/i18n/serverLocale";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.faq",
    descriptionKey: "meta.faqDescription",
  });
}

export default async function FaqPage() {
  const locale = await getSiteLocale();
  return (
    <FooterLegalPageShell
      title={translate(locale, "faq.shellTitle")}
      description={translate(locale, "faq.shellDescription")}
    />
  );
}

import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";
import { SupportCenterPageClient } from "@/components/SupportCenterPageClient";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { translate } from "@/lib/i18n/dictionaries";
import { getSiteLocale } from "@/lib/i18n/serverLocale";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.contact",
    descriptionKey: "meta.contactDescription",
  });
}

export default async function ContactPage() {
  const locale = await getSiteLocale();
  return (
    <FooterLegalPageShell
      title={translate(locale, "meta.contact")}
      withCard={false}
      mainMaxClass="max-w-3xl"
      showBreadcrumb={false}
      showTitle={false}
      contentTopClass="-mt-8 sm:-mt-10"
    >
      <SupportCenterPageClient />
    </FooterLegalPageShell>
  );
}

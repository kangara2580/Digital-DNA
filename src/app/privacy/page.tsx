import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";
import { PrivacyPolicyBody } from "@/components/PrivacyPolicyBody";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { translate } from "@/lib/i18n/dictionaries";
import { getSiteLocale } from "@/lib/i18n/serverLocale";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.privacy",
    descriptionKey: "meta.privacyDescription",
  });
}

export default async function PrivacyPage() {
  const locale = await getSiteLocale();
  return (
    <FooterLegalPageShell
      title={translate(locale, "meta.privacy")}
      withCard={false}
      mainMaxClass="max-w-3xl"
      showBreadcrumb={false}
      showTitle={false}
      contentTopClass="-mt-8 sm:-mt-10"
    >
      <PrivacyPolicyBody />
    </FooterLegalPageShell>
  );
}

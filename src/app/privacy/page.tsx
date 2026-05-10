import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";
import { PrivacyPolicyBody } from "@/components/PrivacyPolicyBody";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.privacy",
    descriptionKey: "meta.privacyDescription",
  });
}

export default function PrivacyPage() {
  return (
    <FooterLegalPageShell
      title="개인정보처리방침"
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

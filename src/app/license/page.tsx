import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";
import { LicensePolicyBody } from "@/components/LicensePolicyBody";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.license",
    descriptionKey: "meta.licenseDescription",
  });
}

export default function LicensePage() {
  return (
    <FooterLegalPageShell
      title="약관 및 정책"
      withCard={false}
      mainMaxClass="max-w-3xl"
      showTitle={false}
      showBreadcrumb={false}
      contentTopClass="-mt-8 sm:-mt-10"
    >
      <LicensePolicyBody />
    </FooterLegalPageShell>
  );
}

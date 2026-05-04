import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";
import { LicensePolicyBody } from "@/components/LicensePolicyBody";

export const metadata = {
  title: "Terms & policies — ARA",
  description: "Digital DNA (ARA) terms, credits, and content policies",
};

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

import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";
import { PrivacyPolicyBody } from "@/components/PrivacyPolicyBody";

export const metadata = {
  title: "Privacy — ARA",
  description: "ARA privacy policy",
};

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

import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";
import { SupportCenterPageClient } from "@/components/SupportCenterPageClient";

export const metadata = {
  title: "고객센터 — ARA",
  description: "FAQ 및 1:1 문의",
};

export default function ContactPage() {
  return (
    <FooterLegalPageShell
      title="고객센터"
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

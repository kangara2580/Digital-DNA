import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";
import { SupportCenterPageClient } from "@/components/SupportCenterPageClient";

export const metadata = {
  title: "Help center — ARA",
  description: "FAQ and contact",
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

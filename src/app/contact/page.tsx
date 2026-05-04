import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";
import { SupportCenterPageClient } from "@/components/SupportCenterPageClient";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.contact",
    descriptionKey: "meta.contactDescription",
  });
}

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

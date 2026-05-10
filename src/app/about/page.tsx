import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";
import { AboutPageBody } from "@/components/AboutPageBody";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.about",
    descriptionKey: "meta.aboutDescription",
  });
}

export default function AboutPage() {
  return (
    <FooterLegalPageShell
      title="소개"
      withCard={false}
      mainMaxClass="max-w-6xl"
      contentTopClass="-mt-10 sm:-mt-14"
      showBreadcrumb={false}
      showTitle={false}
    >
      <AboutPageBody />
    </FooterLegalPageShell>
  );
}

import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";
import { AboutPageBody } from "@/components/AboutPageBody";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { translate } from "@/lib/i18n/dictionaries";
import { getSiteLocale } from "@/lib/i18n/serverLocale";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.about",
    descriptionKey: "meta.aboutDescription",
  });
}

export default async function AboutPage() {
  const locale = await getSiteLocale();
  return (
    <FooterLegalPageShell
      title={translate(locale, "meta.about")}
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

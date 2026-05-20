import { NoticeComposer } from "@/components/NoticeComposer";
import { NoticeListClient } from "@/components/NoticeListClient";
import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { translate } from "@/lib/i18n/dictionaries";
import { getSiteLocale } from "@/lib/i18n/serverLocale";
import { listNotices } from "@/lib/noticesRepo";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.notice",
    descriptionKey: "meta.noticeListDescription",
  });
}

export const dynamic = "force-dynamic";

export default async function NoticePage() {
  const locale = await getSiteLocale();
  const rows = await listNotices();

  return (
    <FooterLegalPageShell
      title={translate(locale, "notice.pageTitle")}
      withCard={false}
      mainMaxClass="max-w-4xl"
      showTitle={false}
      showBreadcrumb={false}
      contentTopClass="-mt-8 sm:-mt-10"
      homeLinkTopClass="mt-20 sm:mt-24"
    >
      <NoticeComposer />
      <NoticeListClient rows={rows} />
    </FooterLegalPageShell>
  );
}

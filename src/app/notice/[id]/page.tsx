import { notFound } from "next/navigation";
import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";
import { NoticeDetailClient } from "@/components/NoticeDetailClient";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { translate } from "@/lib/i18n/dictionaries";
import { socialMetadataFields } from "@/lib/i18n/socialMetadata";
import { getSiteLocale } from "@/lib/i18n/serverLocale";
import { getNoticeById as getCatalogNotice } from "@/data/notices";
import { localizeNotice } from "@/lib/i18n/localizeNotice";
import { getNoticeById } from "@/lib/noticesRepo";

type Props = { params: Promise<{ id: string }> };

function decodeNoticeId(id: string): string {
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const safeId = decodeNoticeId(id);
  const notice = await getNoticeById(safeId);
  if (!notice) {
    return buildPageMetadata({
      titleKey: "meta.notice",
      descriptionKey: "meta.noticeListDescription",
    });
  }
  const locale = await getSiteLocale();
  const suffix = translate(locale, "meta.brandSuffix");
  const fullTitle = `${translate(locale, "meta.noticeDetailTitle", { title: notice.title })}${suffix}`;
  const desc =
    notice.body.replace(/\s+/g, " ").trim().slice(0, 160) || notice.title;
  return {
    title: { absolute: fullTitle },
    description: desc,
    ...socialMetadataFields(locale, fullTitle, desc),
  };
}

export default async function NoticeDetailPage({ params }: Props) {
  const { id } = await params;
  const safeId = decodeNoticeId(id);
  const notice = await getNoticeById(safeId);
  if (!notice) notFound();

  const loc = await getSiteLocale();
  const catalog = getCatalogNotice(safeId);
  const { title: localizedTitle, body: localizedBody } = localizeNotice(
    {
      id: notice.id,
      title: notice.title,
      date: notice.createdAt.slice(0, 10),
      body: notice.body,
      titleEn: catalog?.titleEn,
      bodyEn: catalog?.bodyEn,
    },
    loc,
  );
  const paragraphs = localizedBody.split(/\n\n+/).filter(Boolean);

  return (
    <FooterLegalPageShell
      title={translate(loc, "notice.pageTitle")}
      withCard={false}
      mainMaxClass="max-w-3xl"
      showTitle={false}
      showBreadcrumb={false}
      contentTopClass="-mt-8 sm:-mt-10"
      homeLinkTopClass="mt-20 sm:mt-24"
    >
      <NoticeDetailClient
        title={localizedTitle}
        createdAt={notice.createdAt}
        bodyParagraphs={paragraphs}
        imageUrls={notice.imageUrls}
      />
    </FooterLegalPageShell>
  );
}

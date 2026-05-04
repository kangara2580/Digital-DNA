import { NoticeComposer } from "@/components/NoticeComposer";
import { NoticeListClient } from "@/components/NoticeListClient";
import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";
import { listNotices } from "@/lib/noticesRepo";

export const metadata = {
  title: "Notices — ARA",
  description: "Service updates, policy changes, and events",
};

export const dynamic = "force-dynamic";

export default async function NoticePage() {
  const rows = await listNotices();

  return (
    <FooterLegalPageShell
      title="공지사항"
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

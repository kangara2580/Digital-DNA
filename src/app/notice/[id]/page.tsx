import { notFound } from "next/navigation";
import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";
import { NoticeDetailClient } from "@/components/NoticeDetailClient";
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
  if (!notice) return { title: "Notices — ARA" };
  return {
    title: `${notice.title} — Notices`,
    description: notice.title,
  };
}

export default async function NoticeDetailPage({ params }: Props) {
  const { id } = await params;
  const safeId = decodeNoticeId(id);
  const notice = await getNoticeById(safeId);
  if (!notice) notFound();

  const paragraphs = notice.body.split(/\n\n+/).filter(Boolean);

  return (
    <FooterLegalPageShell
      title="공지사항"
      withCard={false}
      mainMaxClass="max-w-3xl"
      showTitle={false}
      showBreadcrumb={false}
      contentTopClass="-mt-8 sm:-mt-10"
      homeLinkTopClass="mt-20 sm:mt-24"
    >
      <NoticeDetailClient
        title={notice.title}
        createdAt={notice.createdAt}
        bodyParagraphs={paragraphs}
        imageUrls={notice.imageUrls}
      />
    </FooterLegalPageShell>
  );
}

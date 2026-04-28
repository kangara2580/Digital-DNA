import Link from "next/link";
import { notFound } from "next/navigation";
import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";
import { getNoticeById } from "@/lib/noticesRepo";

type Props = { params: Promise<{ id: string }> };

function decodeNoticeId(id: string): string {
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
}

function formatDisplayDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}년 ${m}월 ${day}일`;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const safeId = decodeNoticeId(id);
  const notice = await getNoticeById(safeId);
  if (!notice) return { title: "공지사항 — ARA" };
  return {
    title: `${notice.title} — 공지사항`,
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
      <div>
        <h2 className="text-xl font-extrabold leading-snug tracking-tight text-zinc-100 sm:text-2xl [html[data-theme='light']_&]:text-zinc-900">
          {notice.title}
        </h2>
        <p className="mt-2 font-mono text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          <time dateTime={notice.createdAt}>{formatDisplayDate(notice.createdAt)}</time>
        </p>

        <article className="mt-8 space-y-5 border-t border-white/10 pt-8 text-[15px] leading-[1.85] text-zinc-300 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-wrap">
              {p}
            </p>
          ))}
        </article>

        {notice.imageUrls.length > 0 ? (
          <section className="mt-8 space-y-3 border-t border-white/10 pt-6 [html[data-theme='light']_&]:border-zinc-200">
            <h3 className="text-[13px] font-semibold text-zinc-200 [html[data-theme='light']_&]:text-zinc-800">
              첨부 이미지
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {notice.imageUrls.map((url, idx) => (
                <a
                  key={`${url}-${idx}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-lg border border-white/10 [html[data-theme='light']_&]:border-zinc-200"
                >
                  <img src={url} alt={`공지 첨부 이미지 ${idx + 1}`} className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <p className="mt-10">
          <Link
            href="/notice"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white px-3 py-2 text-[13px] font-semibold text-zinc-900 transition hover:opacity-90 [html[data-theme='light']_&]:border-zinc-300"
          >
            ← 목록으로
          </Link>
        </p>
      </div>
    </FooterLegalPageShell>
  );
}

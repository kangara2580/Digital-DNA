import Link from "next/link";
import { notFound } from "next/navigation";
import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";
import { getAllNoticeIds, getNoticeById } from "@/data/notices";

type Props = { params: Promise<{ id: string }> };

function formatDisplayDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

export function generateStaticParams() {
  return getAllNoticeIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const notice = getNoticeById(id);
  if (!notice) return { title: "공지사항 — ARA" };
  return {
    title: `${notice.title} — 공지사항`,
    description: notice.title,
  };
}

export default async function NoticeDetailPage({ params }: Props) {
  const { id } = await params;
  const notice = getNoticeById(id);
  if (!notice) notFound();

  const paragraphs = notice.body.split(/\n\n+/).filter(Boolean);

  return (
    <FooterLegalPageShell title="공지사항" withCard={false} mainMaxClass="max-w-3xl">
      <div>
        <h2 className="text-xl font-extrabold leading-snug tracking-tight text-zinc-100 sm:text-2xl [html[data-theme='light']_&]:text-zinc-900">
          {notice.title}
        </h2>
        <p className="mt-2 font-mono text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          <time dateTime={notice.date}>{formatDisplayDate(notice.date)}</time>
        </p>

        <article className="mt-8 space-y-5 border-t border-white/10 pt-8 text-[15px] leading-[1.85] text-zinc-300 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-wrap">
              {p}
            </p>
          ))}
        </article>

        <p className="mt-10">
          <Link
            href="/notice"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-reels-cyan hover:underline"
          >
            ← 목록으로
          </Link>
        </p>
      </div>
    </FooterLegalPageShell>
  );
}

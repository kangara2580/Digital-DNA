import Link from "next/link";
import { Pin } from "lucide-react";
import { FooterLegalPageShell } from "@/components/FooterLegalPageShell";
import { getSortedNotices } from "@/data/notices";

export const metadata = {
  title: "공지사항 — REELS MARKET",
  description: "서비스 점검·정책 변경·이벤트 소식",
};

function formatDisplayDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return `${y}. ${String(m).padStart(2, "0")}. ${String(d).padStart(2, "0")}.`;
}

export default function NoticePage() {
  const rows = getSortedNotices();

  return (
    <FooterLegalPageShell
      title="공지사항"
      description="서비스 점검·정책 변경·이벤트 소식을 확인하세요."
      withCard={false}
      mainMaxClass="max-w-4xl"
    >
      <div className="space-y-4">
        {/* 데스크톱: 테이블형 */}
        <div className="hidden overflow-hidden rounded-2xl border border-white/10 [html[data-theme='light']_&]:border-zinc-200 sm:block">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04] font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-600">
                <th className="w-14 px-4 py-3.5 text-center sm:w-16">번호</th>
                <th className="px-4 py-3.5">제목</th>
                <th className="w-36 shrink-0 px-4 py-3.5 text-center sm:w-40">등록일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 [html[data-theme='light']_&]:divide-zinc-200">
              {rows.map((n, index) => (
                <tr
                  key={n.id}
                  className="transition-colors hover:bg-white/[0.04] [html[data-theme='light']_&]:hover:bg-zinc-50"
                >
                  <td className="px-4 py-4 text-center font-mono tabular-nums text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                    {n.pinned ? (
                      <span className="inline-flex items-center justify-center" title="공지">
                        <Pin className="mx-auto h-4 w-4 text-reels-cyan" strokeWidth={2} aria-hidden />
                        <span className="sr-only">공지</span>
                      </span>
                    ) : (
                      rows.length - index
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/notice/${n.id}`}
                      className="font-semibold text-zinc-100 transition hover:text-reels-cyan [html[data-theme='light']_&]:text-zinc-900"
                    >
                      {n.pinned ? (
                        <span className="mr-2 inline-block rounded border border-reels-cyan/35 bg-reels-cyan/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-reels-cyan">
                          공지
                        </span>
                      ) : null}
                      {n.title}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-center font-mono text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                    {formatDisplayDate(n.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 모바일: 카드 리스트 */}
        <ul className="space-y-3 sm:hidden" role="list">
          {rows.map((n, index) => (
            <li key={n.id}>
              <Link
                href={`/notice/${n.id}`}
                className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-reels-cyan/35 hover:bg-white/[0.06] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:hover:bg-zinc-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {n.pinned ? (
                      <span className="mb-1.5 inline-flex items-center gap-1 rounded border border-reels-cyan/35 bg-reels-cyan/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-reels-cyan">
                        <Pin className="h-3 w-3" aria-hidden />
                        공지
                      </span>
                    ) : (
                      <p className="mb-1 font-mono text-[11px] text-zinc-500">#{rows.length - index}</p>
                    )}
                    <p className="font-semibold leading-snug text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                      {n.title}
                    </p>
                  </div>
                  <time
                    dateTime={n.date}
                    className="shrink-0 font-mono text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600"
                  >
                    {formatDisplayDate(n.date)}
                  </time>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <p className="text-center text-[12px] text-zinc-600 [html[data-theme='light']_&]:text-zinc-500">
          총 <strong className="text-zinc-400 [html[data-theme='light']_&]:text-zinc-700">{rows.length}</strong>
          건
        </p>
      </div>
    </FooterLegalPageShell>
  );
}

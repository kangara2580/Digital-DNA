import Link from "next/link";
import { ArrowLeft, Bot, ExternalLink } from "lucide-react";
import { getAdminAccess } from "@/lib/adminAuth";
import { getAdminJobsData } from "@/lib/adminJobsData";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ status?: string; page?: string }>;
};

const navItems = [
  ["요약", "/admin"],
  ["영상 관리", "/admin/videos"],
  ["AI 작업", "/admin/jobs"],
  ["회원", "/admin/members"],
  ["구매", "/admin/purchases"],
  ["신고", "/admin/reports"],
  ["기록", "/admin#audit"],
];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildHref(status: string, page: number): string {
  const qs = new URLSearchParams();
  if (status !== "all") qs.set("status", status);
  if (page > 1) qs.set("page", String(page));
  const query = qs.toString();
  return `/admin/jobs${query ? `?${query}` : ""}`;
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "succeeded"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "running" || status === "queued"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700";
  return <span className={`rounded-full border px-2 py-1 text-xs font-black ${tone}`}>{status}</span>;
}

export default async function AdminJobsPage({ searchParams }: PageProps) {
  const access = await getAdminAccess();
  if (!access.ok) {
    return (
      <main className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-100 text-slate-950">
        <section className="rounded-lg border border-rose-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-black">Admin 접근이 막혀 있습니다</h1>
          <p className="mt-3 text-sm text-slate-600">{access.reason}</p>
        </section>
      </main>
    );
  }

  const params = await searchParams;
  const data = await getAdminJobsData(params);

  return (
    <main className="fixed inset-0 z-[1000] min-h-screen overflow-auto bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-[1002] hidden w-64 border-r border-slate-200 bg-white xl:block">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">ARA</p>
          <h1 className="mt-1 text-xl font-black">Admin Console</h1>
          <p className="mt-2 text-xs text-slate-500">
            {access.mode === "development" ? "개발 미리보기" : access.user?.email}
          </p>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={`flex h-10 items-center rounded-md px-3 text-sm font-bold ${
                href === "/admin/jobs"
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <section className="min-h-screen xl:pl-64">
        <header className="sticky top-0 z-[1001] border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur lg:px-8">
          <Link href="/admin" className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-slate-500">
            <ArrowLeft size={16} />
            Admin 요약으로
          </Link>
          <div className="flex items-center gap-2">
            <Bot size={24} className="text-slate-500" />
            <h2 className="text-2xl font-black">AI 작업 관리</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Reels Generate와 Kling Motion Control 작업을 DB 기준으로 확인합니다.
          </p>
        </header>

        <div className="space-y-5 px-5 py-6 lg:px-8">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <form className="flex flex-wrap items-center gap-3" action="/admin/jobs">
              <select name="status" defaultValue={data.status} className="h-10 rounded-md border border-slate-200 px-3 text-sm">
                <option value="all">전체 상태</option>
                <option value="queued">queued</option>
                <option value="running">running</option>
                <option value="succeeded">succeeded</option>
                <option value="failed">failed</option>
              </select>
              <button className="h-10 rounded-md bg-slate-950 px-4 text-sm font-black text-white">필터</button>
              {["queued", "running", "succeeded", "failed"].map((status) => (
                <span key={status} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {status}: {data.statusCounts[status] ?? 0}
                </span>
              ))}
            </form>
          </section>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3">작업</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">단계</th>
                  <th className="px-4 py-3">사용자</th>
                  <th className="px-4 py-3">결과/오류</th>
                  <th className="px-4 py-3">수정일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>AI 작업이 없습니다.</td>
                  </tr>
                ) : data.items.map((job) => (
                  <tr key={job.id}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{job.id}</td>
                    <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                    <td className="px-4 py-3">
                      <p className="font-bold">{job.stage}</p>
                      <p className="text-xs text-slate-500">{job.progress}%</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{job.userId}</td>
                    <td className="px-4 py-3">
                      {job.outputUrl ? (
                        <a href={job.outputUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-cyan-700">
                          결과 열기 <ExternalLink size={13} />
                        </a>
                      ) : job.errorMessage ? (
                        <details>
                          <summary className="cursor-pointer font-bold text-rose-700">오류 보기</summary>
                          <p className="mt-2 max-w-xl whitespace-pre-wrap text-xs text-rose-600">{job.errorMessage}</p>
                        </details>
                      ) : (
                        <span className="text-slate-400">대기 중</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(job.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <nav className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <p className="font-bold text-slate-600">
              {data.page} / {data.pageCount} 페이지 · 총 {data.total}개
            </p>
            <div className="flex gap-2">
              <Link href={buildHref(data.status, Math.max(1, data.page - 1))} className="rounded-md border border-slate-200 px-3 py-2 font-bold text-slate-700">이전</Link>
              <Link href={buildHref(data.status, Math.min(data.pageCount, data.page + 1))} className="rounded-md border border-slate-200 px-3 py-2 font-bold text-slate-700">다음</Link>
            </div>
          </nav>
        </div>
      </section>
    </main>
  );
}

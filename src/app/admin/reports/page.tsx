import Link from "next/link";
import { ArrowLeft, FileText, Search } from "lucide-react";
import { AdminSubmitButton, FormPendingOverlay } from "@/components/AdminSubmitButton";
import { updateReportStatus } from "@/app/admin/actions";
import { getAdminAccess } from "@/lib/adminAuth";
import { getAdminReportsData } from "@/lib/adminReportsData";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function shortId(value: string | null): string {
  if (!value) return "-";
  return value.length > 14 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}

function badgeClass(status: string): string {
  if (status === "resolved") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "reviewing") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "open") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "dismissed") return "border-slate-200 bg-slate-100 text-slate-600";
  return "border-slate-200 bg-white text-slate-600";
}

function buildHref(params: {
  q: string;
  status: string;
  targetType: string;
  page: number;
}): string {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.status !== "all") qs.set("status", params.status);
  if (params.targetType !== "all") qs.set("targetType", params.targetType);
  if (params.page > 1) qs.set("page", String(params.page));
  const query = qs.toString();
  return `/admin/reports${query ? `?${query}` : ""}`;
}

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const access = await getAdminAccess();
  if (!access.ok) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <section className="mx-auto max-w-lg rounded-lg border border-rose-200 bg-white p-8">
          <h1 className="text-2xl font-black text-slate-950">관리자 접근이 필요합니다</h1>
          <p className="mt-3 text-sm text-slate-600">{access.reason}</p>
          <Link href="/login" className="mt-6 inline-flex h-10 items-center rounded-md bg-slate-950 px-4 text-sm font-bold text-white">
            로그인으로 이동
          </Link>
        </section>
      </main>
    );
  }

  const rawParams = (await searchParams) ?? {};
  const data = await getAdminReportsData({
    q: one(rawParams.q),
    status: one(rawParams.status),
    targetType: one(rawParams.targetType),
    page: one(rawParams.page),
  });

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/admin" className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-950">
              <ArrowLeft size={16} />
              Admin 대시보드
            </Link>
            <div className="flex items-center gap-2">
              <FileText size={24} className="text-slate-500" />
              <h1 className="text-2xl font-black">신고/검수 관리</h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              실제 `reports` 테이블을 기준으로 신고를 배정하고 처리 상태를 남깁니다.
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
            관리자: {access.user?.email ?? "local preview"}
          </div>
        </div>
      </header>

      <div className="space-y-5 px-5 py-6 lg:px-8">
        <section className="grid gap-3 md:grid-cols-4">
          {["open", "reviewing", "resolved", "dismissed"].map((status) => (
            <article key={status} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold text-slate-500">{status}</p>
              <p className="mt-2 text-2xl font-black">{data.statusCounts[status] ?? 0}</p>
            </article>
          ))}
        </section>

        <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_180px_180px_auto]" action="/admin/reports">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              name="q"
              defaultValue={data.q}
              placeholder="신고 ID, 신고자 ID, 대상 ID, 사유 검색"
              className="h-10 w-full rounded-md border border-slate-200 pl-10 pr-3 text-sm"
            />
          </label>
          <select name="status" defaultValue={data.status} className="h-10 rounded-md border border-slate-200 px-3 text-sm">
            <option value="all">모든 상태</option>
            <option value="open">open</option>
            <option value="reviewing">reviewing</option>
            <option value="resolved">resolved</option>
            <option value="dismissed">dismissed</option>
          </select>
          <select name="targetType" defaultValue={data.targetType} className="h-10 rounded-md border border-slate-200 px-3 text-sm">
            <option value="all">모든 대상</option>
            <option value="video">video</option>
            <option value="member">member</option>
            <option value="purchase">purchase</option>
            <option value="job">job</option>
          </select>
          <button className="h-10 rounded-md bg-slate-950 px-4 text-sm font-black text-white">
            검색
          </button>
        </form>

        <section className="grid gap-4 xl:grid-cols-2">
          {data.items.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-slate-500">
              신고 데이터가 없습니다.
            </div>
          ) : data.items.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    {item.targetType}
                  </p>
                  <h2 className="mt-1 text-lg font-black">
                    {item.targetTitle || item.targetId}
                  </h2>
                  <p className="mt-1 font-mono text-xs text-slate-400">{item.id}</p>
                </div>
                <span className={`rounded-full border px-2 py-1 text-xs font-black ${badgeClass(item.status)}`}>
                  {item.status}
                </span>
              </div>

              <div className="mt-4 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                <div>
                  <p className="text-xs font-bold text-slate-500">신고 사유</p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-800">{item.reason}</p>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <p>
                    <span className="font-bold text-slate-600">신고자: </span>
                    {item.reporterNickname || item.reporterEmail || shortId(item.reporterId)}
                  </p>
                  <p>
                    <span className="font-bold text-slate-600">대상 ID: </span>
                    <span className="font-mono text-xs">{shortId(item.targetId)}</span>
                  </p>
                  <p>
                    <span className="font-bold text-slate-600">접수: </span>
                    {formatDate(item.createdAt)}
                  </p>
                  <p>
                    <span className="font-bold text-slate-600">최근 처리: </span>
                    {formatDate(item.updatedAt)}
                  </p>
                </div>
                {item.adminNote ? (
                  <p className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
                    관리자 메모: {item.adminNote}
                  </p>
                ) : null}
              </div>

              <form action={updateReportStatus} className="relative mt-4 grid gap-2">
                <FormPendingOverlay />
                <input type="hidden" name="reportId" value={item.id} />
                <textarea
                  name="adminNote"
                  defaultValue={item.adminNote ?? ""}
                  placeholder="처리 내용, 확인 결과, 내부 메모"
                  className="min-h-20 rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {["open", "reviewing", "resolved", "dismissed"].map((status) => (
                    <AdminSubmitButton
                      key={status}
                      name="status"
                      value={status}
                      className="h-9 rounded-md bg-slate-950 px-2 text-xs font-bold text-white"
                    >
                      {status}
                    </AdminSubmitButton>
                  ))}
                </div>
              </form>
            </article>
          ))}
        </section>

        <nav className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <p className="font-bold text-slate-600">
            {data.page} / {data.pageCount} 페이지 · 총 {data.total}건
          </p>
          <div className="flex gap-2">
            <Link href={buildHref({ q: data.q, status: data.status, targetType: data.targetType, page: Math.max(1, data.page - 1) })} className="rounded-md border border-slate-200 px-3 py-2 font-bold text-slate-700">
              이전
            </Link>
            <Link href={buildHref({ q: data.q, status: data.status, targetType: data.targetType, page: Math.min(data.pageCount, data.page + 1) })} className="rounded-md border border-slate-200 px-3 py-2 font-bold text-slate-700">
              다음
            </Link>
          </div>
        </nav>
      </div>
    </main>
  );
}
